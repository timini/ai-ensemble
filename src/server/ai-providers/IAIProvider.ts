export interface IAIProvider {
  generateContent(prompt: string, model?: string): Promise<string>;
  createEmbedding(input: string[]): Promise<number[][]>;
}
