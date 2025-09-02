export interface IAIProvider {
  generateContent(prompt: string, model?: string): Promise<string>;
  generateContentStream(prompt: string, model?: string): AsyncIterable<string>;
  createEmbedding(input: string[]): Promise<number[][]>;
}
