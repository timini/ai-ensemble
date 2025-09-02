import OpenAI from "openai";
import type { IAIProvider } from "./IAIProvider";

export class GrokProvider implements IAIProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1/",
    });
  }

  async generateContent(prompt: string, model = 'llama3-8b-8192'): Promise<string> {
    const chatCompletion = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
    });
    return chatCompletion.choices[0]!.message.content ?? "";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *generateContentStream(prompt: string, model = 'llama3-8b-8192'): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        yield chunk.choices[0].delta.content;
      }
    }
  }
}
