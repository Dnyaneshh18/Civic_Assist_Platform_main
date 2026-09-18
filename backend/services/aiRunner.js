import { GoogleGenAI, Type, Schema } from '@google/genai';

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
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Skipping AI analysis.');
      return {
        textScore: 0,
        imageScore: 0,
        finalScore: 0,
        authenticity: 'error',
        isSpam: false,
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const aiCategory = toAiCategory(category);
    
    let inlineData = null;

    if (imageBuffer) {
      inlineData = {
        data: imageBuffer.toString('base64'),
        mimeType: imageMimeType || 'image/jpeg',
      };
    } else if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        if (res.ok) {
          const arr = await res.arrayBuffer();
          inlineData = {
            data: Buffer.from(arr).toString('base64'),
            mimeType: res.headers.get('content-type') || 'image/jpeg',
          };
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

Evaluate two aspects and return ONLY a JSON response:
1. text_score (0.0 to 1.0): Does the text legitimately describe a real-world civic issue matching the category? (Spam, gibberish, rants, jokes = 0.0)
2. image_score (0.0 to 1.0): If an image is provided, does it visually show the civic issue matching the category and description? (Memes, selfies, unrelated photos, screenshots = 0.0)
3. fake_score (0.0 to 1.0): The final authenticity score. 1.0 = Genuine issue, 0.0 = Fake/Spam. (If it's clearly an animal photo or unrelated image, give it a low score).
`;

    const contents = [];
    if (inlineData) {
      contents.push({
        role: 'user',
        parts: [
          { inlineData },
          { text: prompt }
        ]
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        text_score: { type: Type.NUMBER, description: "Text authenticity score (0.0 to 1.0)" },
        image_score: { type: Type.NUMBER, description: "Image authenticity score (0.0 to 1.0)" },
        fake_score: { type: Type.NUMBER, description: "Final authenticity score (1.0 = Genuine, 0.0 = Fake/Spam)" },
      },
      required: ["text_score", "image_score", "fake_score"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2, // Low temperature for consistent classification
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned empty text");
    }

    const result = JSON.parse(response.text);

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
    };
  }
}
