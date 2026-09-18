import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const AI_CATEGORY_MAP = {
  road: 'Road',
  streetlight: 'Electricity',
  electricity: 'Electricity',
  water: 'Water',
  sewage: 'Water',
  garbage: 'Waste',
  noise: 'Other',
  park: 'Other',
  other: 'Other',
};

function toAiCategory(category) {
  return AI_CATEGORY_MAP[category] || 'Other';
}

export async function runAIAnalysis({ description, category, imageBuffer, imageMimeType, imageUrl }) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn('API Key is not set. Skipping AI analysis.');
      return { textScore: 0, imageScore: 0, finalScore: 0, authenticity: 'error', isSpam: false };
    }

    const aiCategory = toAiCategory(category);
    const isNvidia = apiKey.startsWith('nvapi-');
    const isGroq = apiKey.startsWith('gsk_');
    const isGemini = apiKey.startsWith('AIza') || apiKey.startsWith('AQ.');

    let base64Image = null;
    let mimeType = imageMimeType || 'image/jpeg';
    
    if (imageBuffer) {
      base64Image = imageBuffer.toString('base64');
    } else if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        if (res.ok) {
          const arr = await res.arrayBuffer();
          mimeType = res.headers.get('content-type') || 'image/jpeg';
          base64Image = Buffer.from(arr).toString('base64');
        }
      } catch (err) {
        console.warn(`AI image fetch failed: ${err.message}`);
      }
    }

    const dataUri = base64Image ? `data:${mimeType};base64,${base64Image}` : null;

    const prompt = `
You are an expert AI moderator for a civic complaint platform.
Analyze the following civic issue report to determine if it is a genuine, actionable civic complaint or fake/spam.

Category Selected by User: ${aiCategory}
Complaint Description: "${description || 'No description provided.'}"

Evaluate two aspects and return ONLY a raw JSON object exactly matching this schema:
{
  "text_score": 0.9,
  "image_score": 0.8,
  "fake_score": 0.85
}

Scoring guide (0.0 to 1.0):
1. text_score: Does the text legitimately describe a real-world civic issue matching the category? (Spam, gibberish, rants = 0.0)
2. image_score: If an image is provided, does it visually show the civic issue matching the category and description? (Memes, selfies, unrelated = 0.0)
3. fake_score: The final authenticity score. 1.0 = Genuine issue, 0.0 = Fake/Spam.

IMPORTANT: Return ONLY valid JSON. Do not include markdown blocks or any other text.
`;

    let responseText = null;
    let lastErr = null;

    // ==========================================
    // 1. NVIDIA NIM INTEGRATION
    // ==========================================
    if (isNvidia) {
      const openai = new OpenAI({ apiKey, baseURL: 'https://integrate.api.nvidia.com/v1' });
      const NVIDIA_MODELS = ['meta/llama-3.2-11b-vision-instruct', 'meta/llama-3.2-90b-vision-instruct'];
      
      const content = [{ type: 'text', text: prompt }];
      if (dataUri) content.push({ type: 'image_url', image_url: { url: dataUri } });

      for (const modelId of NVIDIA_MODELS) {
        try {
          const response = await openai.chat.completions.create({
            model: modelId,
            messages: [{ role: 'user', content }],
            temperature: 0.1,
            max_tokens: 512
          });
          responseText = response.choices[0]?.message?.content;
          if (responseText) break;
        } catch (err) {
          lastErr = err;
          console.warn(`NVIDIA model ${modelId} failed: ${err.message}`);
        }
      }
      if (!responseText) throw new Error(`All NVIDIA models failed. Last error: ${lastErr?.message}`);
    } 
    
    // ==========================================
    // 2. GROQ INTEGRATION
    // ==========================================
    else if (isGroq) {
      const openai = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
      const GROQ_MODELS = [
        'llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview',
        'llama-3.2-11b-vision-instruct', 'llama-3.2-90b-vision-instruct',
        'llama-3.2-11b-vision', 'llama-3.2-90b-vision'
      ];
      
      const content = [{ type: 'text', text: prompt }];
      if (dataUri) content.push({ type: 'image_url', image_url: { url: dataUri } });

      for (const modelId of GROQ_MODELS) {
        try {
          const response = await openai.chat.completions.create({
            model: modelId,
            messages: [{ role: 'user', content }],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          });
          responseText = response.choices[0]?.message?.content;
          if (responseText) break;
        } catch (err) {
          lastErr = err;
          console.warn(`Groq model ${modelId} failed: ${err.message}`);
        }
      }
      if (!responseText) throw new Error(`All Groq vision models failed. Last error: ${lastErr?.message}`);
    } 
    
    // ==========================================
    // 3. GOOGLE GEMINI INTEGRATION
    // ==========================================
    else if (isGemini) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const GEMINI_MODELS = [
        'gemini-1.5-flash', 'gemini-1.5-flash-latest', 
        'gemini-1.5-pro', 'gemini-1.5-flash-8b', 'gemini-1.0-pro-vision-latest'
      ];

      const contents = [];
      if (base64Image) {
        contents.push({ inlineData: { data: base64Image, mimeType } });
      }
      contents.push(prompt);

      for (const modelId of GEMINI_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelId,
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
          });
          const resultAPI = await model.generateContent(contents);
          responseText = resultAPI.response.text();
          if (responseText) break;
        } catch (err) {
          lastErr = err;
          console.warn(`Gemini model ${modelId} failed: ${err.message}`);
        }
      }
      if (!responseText) throw new Error(`All Gemini models failed. Last error: ${lastErr?.message}`);
    } 
    
    else {
      throw new Error(`Unrecognized API Key format. Key must start with 'nvapi-', 'gsk_', 'AIza', or 'AQ.'.`);
    }

    // ==========================================
    // 4. ROBUST PARSING & RETURN
    // ==========================================
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract JSON object if the model wrapped it in conversational text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse AI JSON response. Raw text: ${responseText}`);
    }

    const finalScore = Number(result?.fake_score ?? 0.5);
    const authenticity = finalScore < 0.5 ? 'fake' : 'real';

    return {
      textScore: Number(result?.text_score ?? 0.5),
      imageScore: Number(result?.image_score ?? 0.5),
      finalScore,
      authenticity,
      isSpam: authenticity === 'fake',
    };

  } catch (err) {
    console.error('AI runner failed:', err.message);
    return {
      textScore: 0,
      imageScore: 0,
      finalScore: 0,
      authenticity: 'error',
      isSpam: false,
      rejectionReason: `[OmniAI Error]: ${err.message}`,
    };
  }
}
