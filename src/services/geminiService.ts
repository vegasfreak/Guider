import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `You are MindGuide, a compassionate and supportive mental health companion for university students. 
Your goal is to provide emotional support, active listening, and helpful coping strategies. 
You are not a replacement for professional therapy or medical advice. 
If a user expresses thoughts of self-harm or crisis, gently encourage them to seek professional help and provide resources if appropriate.
Keep your responses empathetic, concise, and student-focused.`;

export const getMindGuideResponse = async (messages: Message[]): Promise<string> => {
  try {
    const model = "gemini-3-flash-preview";
    
    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const lastMessage = messages[messages.length - 1].content;

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: lastMessage }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response. How are you feeling?";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm having a bit of trouble connecting right now. Please know that I'm here for you. Is there something specific on your mind?";
  }
};
