export interface IAIProvider {
  generateContent(prompt: string, model?: string): Promise<string>;
  generateContentStream(prompt: string, model?: string): AsyncIterable<string>;
  createEmbedding?(params: { model: string; input: string; }): Promise<number[]>;
}
