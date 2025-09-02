export interface IAIProvider {
  generateContent(prompt: string): Promise<string>;
  createEmbedding(input: string[]): Promise<number[][]>;
}
