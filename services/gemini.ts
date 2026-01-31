
import { GoogleGenAI } from "@google/genai";
import { BusinessState } from "../types";

export const getAIResponse = async (prompt: string, state: BusinessState) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Create a context string from the current business state
  const context = `
    Current Business Context:
    Inventory Items: ${state.inventory.length}
    Total Inventory Value: ${state.inventory.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)}
    Total Sales Transactions: ${state.sales.length}
    Total Sales Revenue: ${state.sales.reduce((acc, curr) => acc + curr.totalAmount, 0)}
    Total Expenses: ${state.expenses.reduce((acc, curr) => acc + curr.amount, 0)}
    Low Stock Items (Qty < 10): ${state.inventory.filter(i => i.quantity < 10).map(i => i.name).join(', ')}
    
    Instructions:
    Answer questions based on this data. Be helpful, concise, and professional. 
    If asked in Bengali, answer in Bengali. If asked in English, answer in English.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${context}\n\nUser Question: ${prompt}`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
};
