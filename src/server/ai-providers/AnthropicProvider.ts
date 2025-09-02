 
import Anthropic from "@anthropic-ai/sdk";
import type { IAIProvider } from "./IAIProvider";

export class AnthropicProvider implements IAIProvider {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  async generateContent(prompt: string, model = "claude-3-haiku-20240307"): Promise<string> {
    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    return (response.content[0]?.type === 'text' ? response.content[0].text : '') ?? "";
  }

  async *generateContentStream(prompt: string, model = "claude-3-haiku-20240307"): AsyncIterable<string> {
    const stream = await this.anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  async createEmbedding(input: string[]): Promise<number[][]> {
    // Anthropic does not have a direct embedding API
    console.warn("AnthropicProvider does not support createEmbedding.");
    return input.map(() => []); // Return empty embeddings for each input
  }
}
