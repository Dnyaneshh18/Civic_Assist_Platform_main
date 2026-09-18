import Groq from 'groq-sdk';

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
    const groqKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY; // Fallback so they don't have to rename env var immediately if they just replaced the value
    
    if (!groqKey) {
      console.warn('GROQ_API_KEY is not set. Skipping AI analysis.');
      return {
        textScore: 0,
        imageScore: 0,
        finalScore: 0,
        authenticity: 'error',
        isSpam: false,
      };
    }

    const groq = new Groq({ apiKey: groqKey });
    const aiCategory = toAiCategory(category);
    
    let base64Image = null;

    if (imageBuffer) {
      base64Image = `data:${imageMimeType || 'image/jpeg'};base64,${imageBuffer.toString('base64')}`;
    } else if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        if (res.ok) {
          const arr = await res.arrayBuffer();
          const mime = res.headers.get('content-type') || 'image/jpeg';
          base64Image = `data:${mime};base64,${Buffer.from(arr).toString('base64')}`;
        }
      } catch (err) {
        console.warn(`AI image fetch failed: ${err.message}`);
      }
    }

    const prompt = `
You are an expert AI moderator for a civic complaint platform.
Analyze the following civic issue report to determine if it is a genuine, actionable civic complaint or fake/spam.

Category Selected by User: ${aiCategory}
Complaint Description: "${description || 'No description provided.'}"

Evaluate two aspects and return a JSON object exactly matching this schema:
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

    const content = [];
    content.push({ type: 'text', text: prompt });
    
    if (base64Image) {
      content.push({
        type: 'image_url',
        image_url: { url: base64Image }
      });
    }

    const VISION_MODELS = [
      'llama-3.2-11b-vision-preview',
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-instruct',
      'llama-3.2-90b-vision-instruct',
      'llama-3.2-11b-vision',
      'llama-3.2-90b-vision'
    ];

    let responseText = null;
    let lastErr = null;

    for (const modelId of VISION_MODELS) {
      try {
        const response = await groq.chat.completions.create({
          model: modelId,
          messages: [
            {
              role: 'user',
              content: content,
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });
        
        responseText = response.choices[0]?.message?.content;
        if (responseText) {
          console.log(`Successfully used Groq model: ${modelId}`);
          break; // Success! Break the loop.
        }
      } catch (err) {
        lastErr = err;
        console.warn(`Groq model ${modelId} failed: ${err.message}. Trying next model...`);
        // If it's a 400 or 404 about the model not existing, continue to the next one
      }
    }

    if (!responseText) {
      throw new Error(`All Groq vision models failed. Last error: ${lastErr?.message}`);
    }

    const result = JSON.parse(responseText);

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
      rejectionReason: `[Groq Error]: ${err.message}`,
    };
  }
}
