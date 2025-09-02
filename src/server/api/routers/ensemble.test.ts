import { vi } from 'vitest';
import { calculateAgreement } from './ensemble';
import { OpenAIProvider } from '~/server/ai-providers/OpenAIProvider';
import { GoogleProvider } from '~/server/ai-providers/GoogleProvider';
import { AnthropicProvider } from '~/server/ai-providers/AnthropicProvider';
import { instantiateAIClients } from './ensemble';
import { makeParallelAPICalls } from './ensemble';
import { callSummarizerAI } from './ensemble';

vi.mock('~/server/ai-providers/OpenAIProvider');
vi.mock('~/server/ai-providers/GoogleProvider');
vi.mock('~/server/ai-providers/AnthropicProvider');

describe('Ensemble Router Helpers', () => {
  describe('calculateAgreement', () => {
    it('should return zeros if any response is empty', async () => {
      const openaiProvider = new OpenAIProvider('');
      const responses = { openai: '', google: 'response', anthropic: 'response' };
      const scores = await calculateAgreement(openaiProvider, responses);
      expect(scores).toEqual({ og: 0, ga: 0, ao: 0 });
    });

    it('should return zeros if embedding fails', async () => {
      const openaiProvider = new OpenAIProvider('');
      vi.mocked(openaiProvider.createEmbedding).mockRejectedValue(new Error('API Error'));
      const responses = { openai: 'a', google: 'b', anthropic: 'c' };
      const scores = await calculateAgreement(openaiProvider, responses);
      expect(scores).toEqual({ og: 0, ga: 0, ao: 0 });
    });

    it('should calculate scores correctly', async () => {
      const openaiProvider = new OpenAIProvider('');
      vi.mocked(openaiProvider.createEmbedding).mockResolvedValue([
        [1, 0],
        [0, 1],
        [0.8, 0.6],
      ]);
      const responses = { openai: 'a', google: 'b', anthropic: 'c' };
      const scores = await calculateAgreement(openaiProvider, responses);
      expect(scores.og).toBeCloseTo(0);
      expect(scores.ga).toBeCloseTo(0.6);
      expect(scores.ao).toBeCloseTo(0.8);
    });
  });
  describe('instantiateAIClients', () => {
    it('should create instances of AI providers', () => {
      const keys = { openai: 'o-key', google: 'g-key', anthropic: 'a-key' };
      const { openaiProvider, googleProvider, anthropicProvider } = instantiateAIClients(keys);
      expect(openaiProvider).toBeInstanceOf(OpenAIProvider);
      expect(googleProvider).toBeInstanceOf(GoogleProvider);
      expect(anthropicProvider).toBeInstanceOf(AnthropicProvider);
    });
  });

  describe('makeParallelAPICalls', () => {
    it('should return responses from all providers', async () => {
      const openaiProvider = new OpenAIProvider('');
      const googleProvider = new GoogleProvider('');
      const anthropicProvider = new AnthropicProvider('');
      vi.mocked(openaiProvider.generateContent).mockResolvedValue('o-response');
      vi.mocked(googleProvider.generateContent).mockResolvedValue('g-response');
      vi.mocked(anthropicProvider.generateContent).mockResolvedValue('a-response');

      const responses = await makeParallelAPICalls(openaiProvider, googleProvider, anthropicProvider, 'prompt', { openai: 'gpt-4', google: 'gemini-pro', anthropic: 'claude-3' });
      expect(responses).toEqual({
        openai: 'o-response',
        google: 'g-response',
        anthropic: 'a-response',
      });
    });

    it('should handle errors from providers', async () => {
      const openaiProvider = new OpenAIProvider('');
      const googleProvider = new GoogleProvider('');
      const anthropicProvider = new AnthropicProvider('');
      vi.mocked(openaiProvider.generateContent).mockResolvedValue('o-response');
      vi.mocked(googleProvider.generateContent).mockRejectedValue(new Error('g-error'));
      vi.mocked(anthropicProvider.generateContent).mockResolvedValue('a-response');

      const responses = await makeParallelAPICalls(openaiProvider, googleProvider, anthropicProvider, 'prompt', { openai: 'gpt-4', google: 'gemini-pro', anthropic: 'claude-3' });
      expect(responses).toEqual({
        openai: 'o-response',
        google: 'Error: g-error',
        anthropic: 'a-response',
      });
    });
  });

  describe('callSummarizerAI', () => {
    const keys = { openai: 'o-key', google: 'g-key', anthropic: 'a-key' };
    const summarizerPrompt = 'summarizer prompt';

    it('should call the correct provider for summarization', async () => {
      const openaiProvider = new OpenAIProvider('');
      const googleProvider = new GoogleProvider('');
      const anthropicProvider = new AnthropicProvider('');
      vi.mocked(openaiProvider.generateContent).mockResolvedValue('o-summary');
      vi.mocked(googleProvider.generateContent).mockResolvedValue('g-summary');
      vi.mocked(anthropicProvider.generateContent).mockResolvedValue('a-summary');

      const summarizer = { provider: 'openai' as const, model: 'gpt-4' };
      const response = await callSummarizerAI(summarizer, keys, openaiProvider, googleProvider, anthropicProvider, summarizerPrompt);
      expect(response).toBe('o-summary');
      expect(openaiProvider.generateContent).toHaveBeenCalledWith(summarizerPrompt);
    });

    it('should handle summarization errors', async () => {
      const openaiProvider = new OpenAIProvider('');
      const googleProvider = new GoogleProvider('');
      const anthropicProvider = new AnthropicProvider('');
      vi.mocked(openaiProvider.generateContent).mockRejectedValue(new Error('o-error'));

      const summarizer = { provider: 'openai' as const, model: 'gpt-4' };
      const response = await callSummarizerAI(summarizer, keys, openaiProvider, googleProvider, anthropicProvider, summarizerPrompt);
      expect(response).toContain('The summarization process failed.');
    });
  });
});
