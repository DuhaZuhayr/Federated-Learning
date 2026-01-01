import { GoogleGenAI } from "@google/genai";
import { NetworkFeatures } from "../types";

export const analyzeTrafficWithGemini = async (data: NetworkFeatures): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "API Key not found. Please ensure the API_KEY environment variable is set.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Construct a prompt that explains the data context
    const prompt = `
      Act as a Cybersecurity Expert analyzing network traffic data from the NSL-KDD dataset.
      
      Here is a single connection record:
      ${JSON.stringify(data, null, 2)}
      
      Please analyze this record:
      1. Does this look like normal traffic or an attack? (Based on heuristics like High serror_rate, specific flags like S0, or unusual service usage).
      2. Highlight the most suspicious features if any.
      3. Explain briefly why these features indicate a potential threat or why it seems normal.
      
      Keep the response concise (under 150 words) and professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Unable to perform AI analysis at this time.";
  }
};