 
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IAIProvider } from "./IAIProvider";

export class GoogleProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" }); // TODO: Make this configurable
    const result = await model.generateContent(prompt);
    return result.response.text() ?? "";
  }

  async createEmbedding(input: string[]): Promise<number[][]> {
    // Google Generative AI does not have a direct embedding API for multiple inputs like OpenAI
    // For simplicity in this example, we'll return empty arrays or throw an error.
    // In a real application, you'd implement this based on Google's capabilities.
    console.warn("GoogleProvider does not support createEmbedding for multiple inputs directly.");
    return input.map(() => []); // Return empty embeddings for each input
  }
}
