import { vi } from 'vitest';
import { validationRouter } from './validation';
import { TRPCError } from '@trpc/server';
import { createCallerFactory, createTRPCContext } from '@/server/api/trpc';

const createCaller = createCallerFactory(validationRouter);
const mockContext = await createTRPCContext({ headers: new Headers() });
const caller = createCaller(mockContext);

const mockOpenAIList = vi.fn();
const mockGoogleCountTokens = vi.fn();
const mockAnthropicCreate = vi.fn();

vi.mock('openai', () => ({
  default: class {
    models = {
      list: mockOpenAIList,
    };
  },
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = () => ({
      countTokens: mockGoogleCountTokens,
    });
  },
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: mockAnthropicCreate,
    };
  },
}));

describe('Validation Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should validate openai key successfully', async () => {
      mockOpenAIList.mockResolvedValue({});
      const result = await caller.validateApiKey({ provider: 'openai', key: 'test-key' });
      expect(result).toEqual({ success: true, error: null });
    });

    it('should throw TRPCError on openai validation failure', async () => {
      mockOpenAIList.mockRejectedValue(new Error('Invalid key'));
      await expect(
        caller.validateApiKey({ provider: 'openai', key: 'test-key' })
      ).rejects.toThrow(TRPCError);
    });

    it('should validate google key successfully', async () => {
      mockGoogleCountTokens.mockResolvedValue({ totalTokens: 1 });
      const result = await caller.validateApiKey({ provider: 'google', key: 'test-key' });
      expect(result).toEqual({ success: true, error: null });
    });

    it('should throw TRPCError on google validation failure', async () => {
        mockGoogleCountTokens.mockRejectedValue(new Error('Invalid key'));
        await expect(
            caller.validateApiKey({ provider: 'google', key: 'test-key' })
        ).rejects.toThrow(TRPCError);
    });

    it('should validate anthropic key successfully', async () => {
        mockAnthropicCreate.mockResolvedValue({});
        const result = await caller.validateApiKey({ provider: 'anthropic', key: 'test-key' });
        expect(result).toEqual({ success: true, error: null });
    });

    it('should throw TRPCError on anthropic validation failure', async () => {
        mockAnthropicCreate.mockRejectedValue(new Error('Invalid key'));
        await expect(
            caller.validateApiKey({ provider: 'anthropic', key: 'test-key' })
        ).rejects.toThrow(TRPCError);
    });
  });

  describe('getModels', () => {
    it('should return openai models successfully', async () => {
      mockOpenAIList.mockResolvedValue({
        data: [{ id: 'gpt-4' }, { id: 'gpt-3.5-turbo' }],
      });
      const models = await caller.getModels({ provider: 'openai', key: 'test-key' });
      expect(models).toEqual(['gpt-4', 'gpt-3.5-turbo']);
    });

    it('should filter out non-text models from openai', async () => {
      mockOpenAIList.mockResolvedValue({
        data: [
          { id: 'gpt-4' },
          { id: 'gpt-3.5-turbo' },
          { id: 'dall-e-3' },
          { id: 'whisper-1' },
          { id: 'tts-1' },
          { id: 'text-embedding-ada-002' },
          { id: 'text-moderation-latest' },
          { id: 'gpt-4o-realtime-preview' }
        ],
      });
      const models = await caller.getModels({ provider: 'openai', key: 'test-key' });
      // Should only include GPT models, excluding image, audio, embedding, moderation, and realtime models
      expect(models).toEqual(['gpt-4', 'gpt-3.5-turbo']);
    });

    it('should return google models from dynamic API or fallback', async () => {
      // Mock fetch for the Google models API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          models: [
            {
              name: 'models/gemini-2.5-flash',
              supportedGenerationMethods: ['generateContent']
            },
            {
              name: 'models/gemini-2.5-pro',
              supportedGenerationMethods: ['generateContent']
            },
            {
              name: 'models/gemini-1.5-flash',
              supportedGenerationMethods: ['generateContent']
            },
            {
              name: 'models/text-embedding-004',
              supportedGenerationMethods: ['embedContent']
            }
          ]
        })
      });

      const models = await caller.getModels({ provider: 'google', key: 'test-key' });
      // Should return dynamically fetched models, filtered and sorted
      expect(models).toEqual(expect.arrayContaining([
        "gemini-2.5-pro",
        "gemini-2.5-flash", 
        "gemini-1.5-flash"
      ]));
      expect(models).not.toContain("text-embedding-004"); // Should exclude embedding models
    });

    it('should return anthropic models', async () => {
        const models = await caller.getModels({ provider: 'anthropic', key: 'test-key' });
        expect(models).toEqual(["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]);
    });

    it('should throw TRPCError on openai model fetch failure', async () => {
        mockOpenAIList.mockRejectedValue(new Error('API Error'));
        await expect(
            caller.getModels({ provider: 'openai', key: 'test-key' })
        ).rejects.toThrow(TRPCError);
    });
  });

  describe('validateAllKeys', () => {
    it('should return valid status for all keys', async () => {
      mockOpenAIList.mockResolvedValue({ data: [] });
      mockGoogleCountTokens.mockResolvedValue({ totalTokens: 1 });
      mockAnthropicCreate.mockResolvedValue({});

      const result = await caller.validateAllKeys({ openai: 'o-key', google: 'g-key', anthropic: 'a-key' });
      expect(result.statuses).toEqual({ openai: 'valid', google: 'valid', anthropic: 'valid', grok: 'unchecked' });
    });

    it('should return invalid status for failed keys', async () => {
        mockOpenAIList.mockResolvedValue({ data: [] });
        mockGoogleCountTokens.mockRejectedValue(new Error('Invalid key'));
        mockAnthropicCreate.mockResolvedValue({});

        const result = await caller.validateAllKeys({ openai: 'o-key', google: 'g-key', anthropic: 'a-key' });
        expect(result.statuses).toEqual({ openai: 'valid', google: 'invalid', anthropic: 'valid', grok: 'unchecked' });
    });

    it('should return unchecked status for missing keys', async () => {
        mockOpenAIList.mockResolvedValue({ data: [] });
        mockAnthropicCreate.mockResolvedValue({});

        const result = await caller.validateAllKeys({ openai: 'o-key', google: '', anthropic: 'a-key' });
        expect(result.statuses).toEqual({ openai: 'valid', google: 'unchecked', anthropic: 'valid', grok: 'unchecked' });
    });

    it('should return model lists', async () => {
        mockOpenAIList.mockResolvedValue({ data: [{id: 'gpt-4'}] });
        mockGoogleCountTokens.mockResolvedValue({ totalTokens: 1 });
        mockAnthropicCreate.mockResolvedValue({});
        
        // Mock fetch for Google models API
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            models: [
              {
                name: 'models/gemini-2.5-flash',
                supportedGenerationMethods: ['generateContent']
              },
              {
                name: 'models/gemini-2.5-pro',
                supportedGenerationMethods: ['generateContent']
              }
            ]
          })
        });

        const result = await caller.validateAllKeys({ openai: 'o-key', google: 'g-key', anthropic: 'a-key' });
        expect(result.modelLists.openai).toEqual(['gpt-4']);
        expect(result.modelLists.google).toEqual(expect.arrayContaining([
          "gemini-2.5-flash",
          "gemini-2.5-pro"
        ]));
        expect(result.modelLists.anthropic).toEqual(["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]);
        expect(result.modelLists.grok).toEqual(["grok-beta", "grok-2-latest", "grok-2-public-beta", "grok-2", "grok-1"]);
    });
  });
});
