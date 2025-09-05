import { describe, it, expect, beforeAll } from 'vitest';
import { validationRouter } from './validation';
import { TRPCError } from '@trpc/server';
import { createCallerFactory, createTRPCContext } from '@/server/api/trpc';

const createCaller = createCallerFactory(validationRouter);
const mockContext = await createTRPCContext({ headers: new Headers() });
const caller = createCaller(mockContext);

// These tests require real API keys to be set in .env.test
// They will be skipped if the API keys are not available
describe('Validation Router - Integration Tests', () => {
  const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here';
  const hasGoogleKey = process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your-google-ai-key-here';
  const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-your-anthropic-key-here';
  const hasGrokKey = process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'xai-your-grok-key-here';

  beforeAll(() => {
    console.log('Running integration tests with real API keys...');
    console.log(`OpenAI key available: ${!!hasOpenAIKey}`);
    console.log(`Google key available: ${!!hasGoogleKey}`);
    console.log(`Anthropic key available: ${!!hasAnthropicKey}`);
    console.log(`Grok key available: ${!!hasGrokKey}`);
  });

  describe('validateApiKey - Real API Calls', () => {
    it.skipIf(!hasOpenAIKey)('should validate real OpenAI key successfully', async () => {
      const result = await caller.validateApiKey({ 
        provider: 'openai', 
        key: process.env.OPENAI_API_KEY! 
      });
      expect(result).toEqual({ success: true, error: null });
    }, 10000); // 10 second timeout for API calls

    it.skipIf(!hasGoogleKey)('should validate real Google key successfully', async () => {
      const result = await caller.validateApiKey({ 
        provider: 'google', 
        key: process.env.GOOGLE_API_KEY! 
      });
      expect(result).toEqual({ success: true, error: null });
    }, 10000);

    it.skipIf(!hasAnthropicKey)('should validate real Anthropic key successfully', async () => {
      const result = await caller.validateApiKey({ 
        provider: 'anthropic', 
        key: process.env.ANTHROPIC_API_KEY! 
      });
      expect(result).toEqual({ success: true, error: null });
    }, 10000);

    it.skipIf(!hasGrokKey)('should validate real Grok key successfully', async () => {
      const result = await caller.validateApiKey({ 
        provider: 'grok', 
        key: process.env.GROK_API_KEY! 
      });
      expect(result).toEqual({ success: true, error: null });
    }, 15000); // Grok might be slower

    it('should throw TRPCError on invalid OpenAI key', async () => {
      await expect(
        caller.validateApiKey({ provider: 'openai', key: 'sk-invalid-key-12345' })
      ).rejects.toThrow(TRPCError);
    }, 10000);

    it('should throw TRPCError on invalid Google key', async () => {
      await expect(
        caller.validateApiKey({ provider: 'google', key: 'invalid-google-key' })
      ).rejects.toThrow(TRPCError);
    }, 10000);

    it('should throw TRPCError on invalid Anthropic key', async () => {
      await expect(
        caller.validateApiKey({ provider: 'anthropic', key: 'sk-ant-invalid-key' })
      ).rejects.toThrow(TRPCError);
    }, 10000);

    it('should throw TRPCError on invalid Grok key', async () => {
      await expect(
        caller.validateApiKey({ provider: 'grok', key: 'xai-invalid-key' })
      ).rejects.toThrow(TRPCError);
    }, 15000);
  });

  describe('getModels - Real API Calls', () => {
    it.skipIf(!hasOpenAIKey)('should fetch real OpenAI models', async () => {
      const models = await caller.getModels({ 
        provider: 'openai', 
        key: process.env.OPENAI_API_KEY! 
      });
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      // Should contain GPT models
      expect(models.some(model => model.includes('gpt'))).toBe(true);
      // Should not contain non-text models
      expect(models.some(model => model.includes('dall-e'))).toBe(false);
      expect(models.some(model => model.includes('whisper'))).toBe(false);
    }, 10000);

    it.skipIf(!hasGoogleKey)('should fetch real Google models', async () => {
      const models = await caller.getModels({ 
        provider: 'google', 
        key: process.env.GOOGLE_API_KEY! 
      });
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      // Should contain Gemini models
      expect(models.some(model => model.includes('gemini'))).toBe(true);
    }, 10000);

    it.skipIf(!hasAnthropicKey)('should fetch real Anthropic models', async () => {
      const models = await caller.getModels({ 
        provider: 'anthropic', 
        key: process.env.ANTHROPIC_API_KEY! 
      });
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      // Should contain Claude models
      expect(models.some(model => model.includes('claude'))).toBe(true);
    }, 10000);

    it.skipIf(!hasGrokKey)('should fetch real Grok models', async () => {
      const models = await caller.getModels({ 
        provider: 'grok', 
        key: process.env.GROK_API_KEY! 
      });
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      // Should contain Grok models
      expect(models.some(model => model.includes('grok'))).toBe(true);
    }, 15000);

    it('should throw TRPCError on invalid OpenAI key for model fetching', async () => {
      await expect(
        caller.getModels({ provider: 'openai', key: 'sk-invalid-key-12345' })
      ).rejects.toThrow(TRPCError);
    }, 10000);
  });

  describe('validateAllKeys - Real API Calls', () => {
    it.skipIf(!hasOpenAIKey || !hasGoogleKey || !hasAnthropicKey)('should validate all real keys successfully', async () => {
      const keys = {
        openai: process.env.OPENAI_API_KEY!,
        google: process.env.GOOGLE_API_KEY!,
        anthropic: process.env.ANTHROPIC_API_KEY!,
        grok: hasGrokKey ? process.env.GROK_API_KEY! : ''
      };

      const result = await caller.validateAllKeys(keys);
      
      expect(result.statuses.openai).toBe('valid');
      expect(result.statuses.google).toBe('valid');
      expect(result.statuses.anthropic).toBe('valid');
      
      if (hasGrokKey) {
        expect(result.statuses.grok).toBe('valid');
      } else {
        expect(result.statuses.grok).toBe('unchecked');
      }

      // Check that model lists are returned
      expect(Array.isArray(result.modelLists.openai)).toBe(true);
      expect(result.modelLists.openai.length).toBeGreaterThan(0);
      expect(Array.isArray(result.modelLists.google)).toBe(true);
      expect(result.modelLists.google.length).toBeGreaterThan(0);
      expect(Array.isArray(result.modelLists.anthropic)).toBe(true);
      expect(result.modelLists.anthropic.length).toBeGreaterThan(0);
    }, 20000); // Longer timeout for multiple API calls

    it('should handle mixed valid and invalid keys', async () => {
      const keys = {
        openai: hasOpenAIKey ? process.env.OPENAI_API_KEY! : 'sk-invalid-key',
        google: 'invalid-google-key',
        anthropic: hasAnthropicKey ? process.env.ANTHROPIC_API_KEY! : 'sk-ant-invalid',
        grok: ''
      };

      const result = await caller.validateAllKeys(keys);
      
      if (hasOpenAIKey) {
        expect(result.statuses.openai).toBe('valid');
      } else {
        expect(result.statuses.openai).toBe('invalid');
      }
      
      expect(result.statuses.google).toBe('invalid');
      
      if (hasAnthropicKey) {
        expect(result.statuses.anthropic).toBe('valid');
      } else {
        expect(result.statuses.anthropic).toBe('invalid');
      }
      
      expect(result.statuses.grok).toBe('unchecked');
    }, 20000);

    it('should handle empty keys', async () => {
      const keys = {
        openai: '',
        google: '',
        anthropic: '',
        grok: ''
      };

      const result = await caller.validateAllKeys(keys);
      
      expect(result.statuses.openai).toBe('unchecked');
      expect(result.statuses.google).toBe('unchecked');
      expect(result.statuses.anthropic).toBe('unchecked');
      expect(result.statuses.grok).toBe('unchecked');
    }, 5000);
  });
});







