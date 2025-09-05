import { describe, it, expect } from 'vitest';
import {
  createAllResponses,
  createAllModels,
  createKeysMapping,
  createModelsMapping,
  generateManualResponseId,
  validateManualResponse,
  type ManualResponseState,
} from './manualResponseUtils';
import type { SelectedModel } from '../_components/ModelSelection';
import type { Provider } from '../_components/ProviderSettings';

describe('manualResponseUtils', () => {
  describe('createAllResponses', () => {
    it('should combine streaming data responses with manual responses', () => {
      const streamingDataResponses = {
        'model1': 'Response from model 1',
        'model2': 'Response from model 2',
      };
      
      const manualResponses: ManualResponseState = {
        'manual-123': {
          provider: 'anthropic',
          modelName: 'Claude-3-Sonnet',
          response: 'Manual response 1',
        },
        'manual-456': {
          provider: 'openai',
          modelName: 'GPT-4',
          response: 'Manual response 2',
        },
      };
      
      const result = createAllResponses(
        streamingDataResponses,
        manualResponses,
        'manual-789',
        'New manual response'
      );
      
      expect(result).toEqual({
        'model1': 'Response from model 1',
        'model2': 'Response from model 2',
        'manual-123': 'Manual response 1',
        'manual-456': 'Manual response 2',
        'manual-789': 'New manual response',
      });
    });

    it('should handle empty manual responses', () => {
      const streamingDataResponses = {
        'model1': 'Response from model 1',
      };
      
      const manualResponses: ManualResponseState = {};
      
      const result = createAllResponses(
        streamingDataResponses,
        manualResponses,
        'manual-123',
        'New manual response'
      );
      
      expect(result).toEqual({
        'model1': 'Response from model 1',
        'manual-123': 'New manual response',
      });
    });
  });

  describe('createAllModels', () => {
    it('should combine selected models with manual response models', () => {
      const selectedModels: SelectedModel[] = [
        {
          id: 'model1',
          name: 'OpenAI - GPT-4',
          provider: 'openai',
          model: 'gpt-4',
        },
        {
          id: 'model2',
          name: 'Google - Gemini-Pro',
          provider: 'google',
          model: 'gemini-pro',
        },
      ];
      
      const manualResponses: ManualResponseState = {
        'manual-123': {
          provider: 'anthropic',
          modelName: 'Claude-3-Sonnet',
          response: 'Manual response 1',
        },
      };
      
      const result = createAllModels(
        selectedModels,
        manualResponses,
        'manual-456',
        'openai',
        'GPT-3.5-Turbo'
      );
      
      expect(result).toEqual([
        {
          id: 'model1',
          name: 'OpenAI - GPT-4',
          provider: 'openai',
          model: 'gpt-4',
        },
        {
          id: 'model2',
          name: 'Google - Gemini-Pro',
          provider: 'google',
          model: 'gemini-pro',
        },
        {
          id: 'manual-123',
          name: 'Anthropic - Claude-3-Sonnet',
          provider: 'anthropic',
          model: 'Claude-3-Sonnet',
        },
        {
          id: 'manual-456',
          name: 'Openai - GPT-3.5-Turbo',
          provider: 'openai',
          model: 'GPT-3.5-Turbo',
        },
      ]);
    });

    it('should handle empty manual responses', () => {
      const selectedModels: SelectedModel[] = [
        {
          id: 'model1',
          name: 'OpenAI - GPT-4',
          provider: 'openai',
          model: 'gpt-4',
        },
      ];
      
      const manualResponses: ManualResponseState = {};
      
      const result = createAllModels(
        selectedModels,
        manualResponses,
        'manual-123',
        'anthropic',
        'Claude-3-Sonnet'
      );
      
      expect(result).toEqual([
        {
          id: 'model1',
          name: 'OpenAI - GPT-4',
          provider: 'openai',
          model: 'gpt-4',
        },
        {
          id: 'manual-123',
          name: 'Anthropic - Claude-3-Sonnet',
          provider: 'anthropic',
          model: 'Claude-3-Sonnet',
        },
      ]);
    });
  });

  describe('createKeysMapping', () => {
    it('should create correct key mapping for regular and manual models', () => {
      const allModels = [
        { id: 'model1', provider: 'openai' as Provider },
        { id: 'model2', provider: 'google' as Provider },
        { id: 'manual-123', provider: 'anthropic' as Provider },
      ];
      
      const providerKeys = {
        openai: 'sk-test-openai-key',
        google: 'test-google-key',
        anthropic: 'test-anthropic-key',
        grok: '',
      };
      
      const result = createKeysMapping(allModels, providerKeys);
      
      expect(result).toEqual({
        'model1': 'sk-test-openai-key',
        'model2': 'test-google-key',
        'manual-123': 'manual-response',
      });
    });
  });

  describe('createModelsMapping', () => {
    it('should create correct model name mapping', () => {
      const allModels = [
        { id: 'model1', model: 'gpt-4' },
        { id: 'model2', model: 'gemini-pro' },
        { id: 'manual-123', model: 'Claude-3-Sonnet' },
      ];
      
      const result = createModelsMapping(allModels);
      
      expect(result).toEqual({
        'model1': 'gpt-4',
        'model2': 'gemini-pro',
        'manual-123': 'Claude-3-Sonnet',
      });
    });
  });

  describe('generateManualResponseId', () => {
    it('should generate unique IDs with manual- prefix and counter', () => {
      const id1 = generateManualResponseId();
      const id2 = generateManualResponseId();
      
      expect(id1).toMatch(/^manual-\d+-\d+$/);
      expect(id2).toMatch(/^manual-\d+-\d+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with increasing counters', () => {
      const id1 = generateManualResponseId();
      const id2 = generateManualResponseId();
      
      const counter1 = parseInt(id1.split('-')[2]!);
      const counter2 = parseInt(id2.split('-')[2]!);
      
      expect(counter2).toBeGreaterThan(counter1);
    });
  });

  describe('validateManualResponse', () => {
    it('should validate correct manual response data', () => {
      const result = validateManualResponse('anthropic', 'Claude-3-Sonnet', 'Test response');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty provider', () => {
      const result = validateManualResponse('' as Provider, 'Claude-3-Sonnet', 'Test response');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Provider is required');
    });

    it('should reject empty model name', () => {
      const result = validateManualResponse('anthropic', '', 'Test response');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Model name is required');
    });

    it('should reject whitespace-only model name', () => {
      const result = validateManualResponse('anthropic', '   ', 'Test response');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Model name is required');
    });

    it('should reject empty response', () => {
      const result = validateManualResponse('anthropic', 'Claude-3-Sonnet', '');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Response is required');
    });

    it('should reject whitespace-only response', () => {
      const result = validateManualResponse('anthropic', 'Claude-3-Sonnet', '   ');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Response is required');
    });
  });
});
