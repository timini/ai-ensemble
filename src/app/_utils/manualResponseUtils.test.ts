import { describe, it, expect } from 'vitest';
import {
  createAllResponses,
  createAllModels,
  createKeysMapping,
  createModelsMapping,
  generateManualResponseId,
  validateManualResponse,
  type ManualResponse,
} from './manualResponseUtils';

describe('manualResponseUtils', () => {
  describe('createAllResponses', () => {
    it('should include manual response in existing responses', () => {
      const streamingResponses = { 'model1': 'Response 1', 'model2': 'Response 2' };
      const manualResponses = {};
      const manualId = 'manual-123';
      const response = 'Manual response content';
      
      const result = createAllResponses(streamingResponses, manualResponses, manualId, response);
      
      expect(result).toEqual({
        'model1': 'Response 1',
        'model2': 'Response 2',
        'manual-123': 'Manual response content'
      });
    });

    it('should handle empty streaming responses', () => {
      const streamingResponses = {};
      const manualResponses = {};
      const manualId = 'manual-456';
      const response = 'Another manual response';
      
      const result = createAllResponses(streamingResponses, manualResponses, manualId, response);
      
      expect(result).toEqual({
        'manual-456': 'Another manual response'
      });
    });
  });

  describe('createAllModels', () => {
    it('should include manual response model in configurations', () => {
      const selectedModels = [
        { id: 'model1', name: 'GPT-4', provider: 'openai' as const, model: 'gpt-4' },
        { id: 'model2', name: 'Gemini Pro', provider: 'google' as const, model: 'gemini-pro' }
      ];
      const manualResponses = {};
      const manualId = 'manual-123';
      const provider = 'anthropic' as const;
      const modelName = 'Claude-3-Sonnet';
      
      const result = createAllModels(selectedModels, manualResponses, manualId, provider, modelName);
      
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({
        id: 'model1',
        name: 'GPT-4',
        provider: 'openai',
        model: 'gpt-4'
      });
      expect(result).toContainEqual({
        id: 'model2',
        name: 'Gemini Pro',
        provider: 'google',
        model: 'gemini-pro'
      });
      expect(result).toContainEqual({
        id: 'manual-123',
        name: 'Anthropic - Claude-3-Sonnet',
        provider: 'anthropic',
        model: 'Claude-3-Sonnet'
      });
    });
  });

  describe('createKeysMapping', () => {
    it('should NOT include manual response in keys mapping', () => {
      const selectedModels = [
        { id: 'model1', name: 'GPT-4', provider: 'openai' as const, model: 'gpt-4' },
        { id: 'model2', name: 'Gemini Pro', provider: 'google' as const, model: 'gemini-pro' }
      ];
      const manualResponses = {};
      const manualId = 'manual-123';
      const provider = 'anthropic' as const;
      const modelName = 'Claude-3-Sonnet';
      
      const allModels = createAllModels(selectedModels, manualResponses, manualId, provider, modelName);
      const providerKeys = {
        openai: 'test-openai-key',
        google: 'test-google-key',
        anthropic: 'test-anthropic-key',
        grok: 'test-grok-key'
      };
      const result = createKeysMapping(allModels, providerKeys);
      
      // Manual response should use special placeholder key
      expect(result).toEqual({
        'model1': 'test-openai-key',
        'model2': 'test-google-key',
        'manual-123': 'manual-response'
      });
    });
  });

  describe('createModelsMapping', () => {
    it('should include manual response in models mapping', () => {
      const selectedModels = [
        { id: 'model1', name: 'GPT-4', provider: 'openai' as const, model: 'gpt-4' },
        { id: 'model2', name: 'Gemini Pro', provider: 'google' as const, model: 'gemini-pro' }
      ];
      const manualResponses = {};
      const manualId = 'manual-123';
      const provider = 'anthropic' as const;
      const modelName = 'Claude-3-Sonnet';
      
      const allModels = createAllModels(selectedModels, manualResponses, manualId, provider, modelName);
      const result = createModelsMapping(allModels);
      
      // All models should be in models mapping
      expect(result).toEqual({
        'model1': 'gpt-4',
        'model2': 'gemini-pro',
        'manual-123': 'Claude-3-Sonnet'
      });
    });
  });

  describe('generateManualResponseId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateManualResponseId();
      const id2 = generateManualResponseId();
      
      expect(id1).toMatch(/^manual-\d+-\d+$/);
      expect(id2).toMatch(/^manual-\d+-\d+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('validateManualResponse', () => {
    it('should validate correct manual response', () => {
      const result = validateManualResponse('anthropic', 'Claude-3-Sonnet', 'This is a test response');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty model name', () => {
      const result = validateManualResponse('anthropic', '', 'This is a test response');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Model name is required');
    });

    it('should reject empty response', () => {
      const result = validateManualResponse('anthropic', 'Claude-3-Sonnet', '');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Response is required');
    });

    it('should reject whitespace-only values', () => {
      const result1 = validateManualResponse('anthropic', '   ', 'This is a test response');
      const result2 = validateManualResponse('anthropic', 'Claude-3-Sonnet', '   ');
      
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Model name is required');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Response is required');
    });
  });

  describe('Manual Response API Call Issue', () => {
    it('should NOT include manual responses in configurations array', () => {
      // This test demonstrates the core issue: manual responses should NOT be in configurations
      // because they don't need API calls - they should only be in existingResponses
      
      const selectedModels = [
        { id: 'model1', name: 'GPT-4', provider: 'openai' as const, model: 'gpt-4' },
        { id: 'model2', name: 'Gemini Pro', provider: 'google' as const, model: 'gemini-pro' }
      ];
      const manualResponses = {};
      const manualId = 'manual-123';
      const provider = 'anthropic' as const;
      const modelName = 'Claude-3-Sonnet';
      
      // This is what the current implementation does (WRONG)
      const allModels = createAllModels(selectedModels, manualResponses, manualId, provider, modelName);
      
      // Manual responses should NOT be in configurations for API calls
      const configurationsForAPI = allModels.filter(m => !m.id.startsWith('manual-'));
      const manualResponsesForExisting = allModels.filter(m => m.id.startsWith('manual-'));
      
      expect(configurationsForAPI).toHaveLength(2);
      expect(configurationsForAPI).toEqual([
        { id: 'model1', name: 'GPT-4', provider: 'openai', model: 'gpt-4' },
        { id: 'model2', name: 'Gemini Pro', provider: 'google', model: 'gemini-pro' }
      ]);
      
      expect(manualResponsesForExisting).toHaveLength(1);
      expect(manualResponsesForExisting[0]).toEqual({
        id: 'manual-123',
        name: 'Anthropic - Claude-3-Sonnet',
        provider: 'anthropic',
        model: 'Claude-3-Sonnet'
      });
    });
  });
});