 
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IAIProvider } from "./IAIProvider";

export class GoogleProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string, modelName = "gemini-1.5-flash"): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text() ?? "";
  }

  async *generateContentStream(prompt: string, modelName = "gemini-1.5-flash"): AsyncIterable<string> {
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  }

  async createEmbedding(input: string[]): Promise<number[][]> {
    // Google Generative AI does not have a direct embedding API for multiple inputs like OpenAI
    // For simplicity in this example, we'll return empty arrays or throw an error.
    // In a real application, you'd implement this based on Google's capabilities.
    console.warn("GoogleProvider does not support createEmbedding for multiple inputs directly.");
    return input.map(() => []); // Return empty embeddings for each input
  }
}
