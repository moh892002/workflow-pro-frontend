import { GoogleGenAI } from "@google/genai";
import { Task, PerformanceReport } from "../types";

// Initialize the Google GenAI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const AIService = {
  /**
   * Send a chat message to the AI and get a response.
   */
  chat: async (
    history: { role: "user" | "model"; text: string }[],
    newMessage: string
  ): Promise<string> => {
    try {
      if (!process.env.API_KEY) {
        // Fallback mock response if no API key is present for demo purposes
        await new Promise((r) => setTimeout(r, 1500));
        return "I am GPT AI. I can help you with task management, but I need a valid API Key to function fully. Please check your configuration.";
      }

      const model = "gemini-2.5-flash";
      const systemInstruction = `You are 'GPT AI', a highly intelligent, human-like, and professional virtual assistant integrated into 'WorkFlow Pro'.
      
      Your core responsibilities:
      1. **Task & Project Assistance**: Help users manage tasks, optimize workflows, and understand their performance.
      2. **General Knowledge**: You are an expert in Technology, Science, Education, Work Productivity, Personal Development, and Current Events. You can answer ANY general question the user asks.
      3. **Conversation Style**: 
         - Be natural, engaging, and human-like.
         - Use emojis occasionally to keep the tone friendly but professional.
         - Do not sound like a robot.
         - If the user asks for advice, provide actionable and thoughtful steps.
      
      Important:
      - If a user asks about their specific database data (like "what are my tasks?"), kindly explain that you can provide general advice, but they should check the specific dashboard page for real-time database records.
      - Always be polite and encouraging.`;

      // Construct content for the model
      const chatHistory = history
        .map((h) => `${h.role === "user" ? "User" : "Model"}: ${h.text}`)
        .join("\n");
      const prompt = `${chatHistory}\nUser: ${newMessage}\nModel:`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      return (
        response.text ||
        "I apologize, I couldn't generate a response at this time."
      );
    } catch (error) {
      console.error("AI Chat Error:", error);
      return "I'm having trouble connecting to the server right now. Please try again later.";
    }
  },

  /**
   * Analyze employee performance based on tasks.
   */
  analyzePerformance: async (
    tasks: Task[],
    employeeName: string
  ): Promise<PerformanceReport> => {
    try {
      if (!process.env.API_KEY) {
        // Mock Response
        await new Promise((r) => setTimeout(r, 2000));
        return {
          score: 85,
          summary:
            "Great job! You have completed most of your high-priority tasks on time.",
          suggestions: [
            "Try to update task status more frequently.",
            "Focus on the remaining overdue task.",
          ],
          level: "Good",
        };
      }

      const taskSummary = tasks.map((t) => ({
        title: t.title,
        priority: t.priority,
        status: t.status,
        deadline: t.deadline,
        progress: t.progress,
      }));

      const prompt = `
        Analyze the performance of employee "${employeeName}" based on the following task data:
        ${JSON.stringify(taskSummary)}

        Return a JSON object ONLY with the following structure:
        {
          "score": (number 0-100),
          "summary": (string, brief summary of performance),
          "suggestions": (array of strings, 2-3 specific improvements),
          "level": (string, one of: 'Excellent', 'Good', 'Needs Improvement', 'Critical')
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const json = JSON.parse(text);

      return {
        score: json.score || 0,
        summary: json.summary || "No data available.",
        suggestions: json.suggestions || [],
        level: json.level || "Needs Improvement",
      };
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return {
        score: 0,
        summary: "Error analyzing data.",
        suggestions: ["Check internet connection", "Try again later"],
        level: "Critical",
      };
    }
  },
};
