 
import OpenAI from "openai";
import type { IAIProvider } from "./IAIProvider";

export class OpenAIProvider implements IAIProvider {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  async generateContent(prompt: string, model = "gpt-3.5-turbo"): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async *generateContentStream(prompt: string, model = "gpt-3.5-turbo"): AsyncIterable<string> {
    const stream = await this.openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async createEmbedding(params: { model: string; input: string; }): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: params.model,
      input: params.input,
    });
    return response.data[0]!.embedding;
  }
}
