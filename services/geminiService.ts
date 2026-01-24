import { GoogleGenAI, Type } from "@google/genai";

// Safely retrieve environment variable or default to empty
const getEnvApiKey = () => {
  try {
    // Check if process is defined (Node/Webpack)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || '';
    }
    // Check if import.meta.env is defined (Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY || '';
    }
  } catch (e) {
    // Ignore errors
  }
  return '';
};

let apiKey = getEnvApiKey();

export const setGeminiKey = (key: string) => {
  apiKey = key;
};

export const getGeminiKey = () => apiKey;

export const generateWordPair = async (topic: string): Promise<{ secretWord: string; impostorWord: string }> => {
  if (!apiKey) {
    // Fallback logic if no key is present, allows game to proceed without AI
    console.warn("API Key missing, using default words");
    return { secretWord: "Beach", impostorWord: "Desert" };
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