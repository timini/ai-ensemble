import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateAgreement } from './ensemble';
import { OpenAIProvider } from '@/server/ai-providers/OpenAIProvider';

describe('Ensemble Router Helpers', () => {

  describe('calculateAgreement dynamic', () => {
    let embeddingProvider: OpenAIProvider;

    beforeEach(() => {
      embeddingProvider = new OpenAIProvider('fake-key');
      vi.spyOn(embeddingProvider, 'createEmbedding').mockImplementation(async (params) => {
        const input = (params as { input: string }).input;
        if (input === "Dogs are loyal.") return [1, 0.8, 0, 0]; // Vector A
        if (input === "Canines are faithful.") return [0.8, 1, 0, 0]; // Vector A' (similar to A)
        if (input === "Cats are independent.") return [0, 0, 1, 0.8]; // Vector B
        if (input === "Felines are aloof.") return [0, 0, 0.8, 1]; // Vector B' (similar to B)
        return [0, 0, 0, 0];
      });
    });

    it('should return a high score for two very similar responses', async () => {
      const responses = {
        'model-1': "Dogs are loyal.",
        'model-2': "Canines are faithful.",
      };
      const scores = await calculateAgreement(embeddingProvider, responses);
      expect(scores.length).toBe(1);
      expect(scores[0]!.score).toBeGreaterThan(0.9);
    });

    it('should return a low score for two dissimilar responses', async () => {
      const responses = {
        'model-1': "Dogs are loyal.",
        'model-2': "Cats are independent.",
      };
      const scores = await calculateAgreement(embeddingProvider, responses);
      expect(scores.length).toBe(1);
      expect(scores[0]!.score).toBeLessThan(0.1);
    });

    it('should handle three models with mixed similarity', async () => {
      const responses = {
        'model-1': "Dogs are loyal.",
        'model-2': "Canines are faithful.",
        'model-3': "Cats are independent.",
      };
      const scores = await calculateAgreement(embeddingProvider, responses);
      expect(scores.length).toBe(3); // 3 pairs: (1,2), (1,3), (2,3)

      const score12 = scores.find(s => s.id1 === 'model-1' && s.id2 === 'model-2')!.score;
      const score13 = scores.find(s => s.id1 === 'model-1' && s.id2 === 'model-3')!.score;
      const score23 = scores.find(s => s.id1 === 'model-2' && s.id2 === 'model-3')!.score;
      
      expect(score12).toBeGreaterThan(0.9); // High similarity
      expect(score13).toBeLessThan(0.1);  // Low similarity
      expect(score23).toBeLessThan(0.1);  // Low similarity
    });

    it('should return an empty array for less than two responses', async () => {
      const responses = { 'model-1': "Dogs are loyal." };
      const scores = await calculateAgreement(embeddingProvider, responses);
      expect(scores).toEqual([]);
    });

    it('should handle four models with two distinct groups', async () => {
        const responses = {
            'dog-1': "Dogs are loyal.",
            'dog-2': "Canines are faithful.",
            'cat-1': "Cats are independent.",
            'cat-2': "Felines are aloof.",
        };
        const scores = await calculateAgreement(embeddingProvider, responses);
        expect(scores.length).toBe(6); // 6 pairs

        const dogPairScore = scores.find(s => s.id1 === 'dog-1' && s.id2 === 'dog-2')!.score;
        const catPairScore = scores.find(s => s.id1 === 'cat-1' && s.id2 === 'cat-2')!.score;
        const crossPairScore = scores.find(s => s.id1 === 'dog-1' && s.id2 === 'cat-1')!.score;
        
        expect(dogPairScore).toBeGreaterThan(0.9);
        expect(catPairScore).toBeGreaterThan(0.9);
        expect(crossPairScore).toBeLessThan(0.1);
    });
  });
});
