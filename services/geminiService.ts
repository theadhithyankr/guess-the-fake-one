import { GoogleGenAI, Type } from "@google/genai";

// We use a safe default if no key is provided in the UI, but the UI allows user input
let apiKey = process.env.API_KEY || '';

export const setGeminiKey = (key: string) => {
  apiKey = key;
};

export const getGeminiKey = () => apiKey;

export const generateWordPair = async (topic: string): Promise<{ secretWord: string; impostorWord: string }> => {
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a JSON object with two words for a social deduction game. 
      Topic: ${topic || 'General'}.
      The 'secretWord' is the common word.
      The 'impostorWord' is slightly different but related, plausible enough to confuse the impostor.
      Example: { "secretWord": "Coffee", "impostorWord": "Tea" }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            secretWord: { type: Type.STRING },
            impostorWord: { type: Type.STRING },
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback for demo purposes if API fails
    return { secretWord: "Beach", impostorWord: "Desert" };
  }
};
