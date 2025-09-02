import type { IAIProvider } from "./IAIProvider";

export class GrokProvider implements IAIProvider {
  private readonly apiKey: string;
  private readonly baseURL = "https://api.x.ai/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, model = "grok-beta"): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };

    return data.choices[0]?.message?.content ?? "";
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async *generateContentStream(prompt: string, model = "grok-beta"): AsyncIterable<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data) as {
                choices: Array<{
                  delta: {
                    content?: string;
                  };
                }>;
              };
              
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (error) {
              // Ignore JSON parse errors for malformed chunks
              console.warn('Failed to parse Grok streaming chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async createEmbedding(input: string[]): Promise<number[][]> {
    // Grok doesn't have embedding API, return empty arrays or use a fallback
    console.warn("GrokProvider does not support createEmbedding. Returning empty arrays.");
    return input.map(() => []);
  }
}
