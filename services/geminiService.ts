
import { GoogleGenAI, Type } from "@google/genai";

// Initialize with the standard API key from environment, following strict guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const breakdownTask = async (taskTitle: string) => {
  const prompt = `Como um especialista em TDAH, quebre a seguinte tarefa em no máximo 5 micro-passos concretos e fáceis de iniciar para evitar paralisia executiva. Tarefa: "${taskTitle}"`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de micro-passos para a tarefa"
            },
            strategy: {
              type: Type.STRING,
              description: "Uma dica rápida de foco para esta tarefa específica"
            }
          },
          required: ["steps", "strategy"]
        }
      }
    });
    
    // Correctly extract the text property from the response object as per guidelines.
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error breaking down task:", error);
    return null;
  }
};

export const getMotivation = async (stats: { points: number, streak: number }) => {
  const prompt = `Gere uma frase curta e encorajadora para uma pessoa com TDAH que tem ${stats.points} pontos e uma sequência de ${stats.streak} dias de foco. Seja amigável e focado em progresso, não perfeição.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Directly access the .text property from the GenerateContentResponse.
    return response.text;
  } catch (error) {
    return "Continue brilhando! Cada pequeno passo conta.";
  }
};
