import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validationRouter } from './validation';
import { createCallerFactory } from '../trpc';

// Schema validation tests to catch parameter mismatches
describe('Validation Router Schema Tests', () => {
  const createCaller = createCallerFactory(validationRouter);
  const caller = createCaller({});

  describe('validateApiKey parameter schema', () => {
    it('should accept correct parameters { provider, key }', async () => {
      // This should not throw a validation error
      const validInput = { provider: 'openai' as const, key: 'test-key' };
      
      try {
        await caller.validateApiKey(validInput);
      } catch (error) {
        // We expect this to fail at the API level (invalid key), not at schema validation
        // The error should NOT be about missing 'key' parameter
        expect(error).toBeDefined();
        expect(String(error)).not.toContain('Required');
        expect(String(error)).not.toContain('path');
      }
    });

    it('should reject incorrect parameters { provider, apiKey }', async () => {
      // This is the regression case - using 'apiKey' instead of 'key'
      const invalidInput = { provider: 'openai' as const, apiKey: 'test-key' };
      
      try {
        // @ts-expect-error - Intentionally testing incorrect parameter name
        await caller.validateApiKey(invalidInput);
        expect.fail('Should have thrown validation error for missing "key" parameter');
      } catch (error) {
        // Should get zod validation error about missing 'key' field
        expect(String(error)).toContain('Required');
        expect(String(error)).toContain('key');
      }
    });

    it('should require both provider and key parameters', async () => {
      // Test missing provider
      try {
        // @ts-expect-error - Intentionally testing missing provider
        await caller.validateApiKey({ key: 'test-key' });
        expect.fail('Should have thrown validation error for missing provider');
      } catch (error) {
        expect(String(error)).toContain('Required');
      }

      // Test missing key
      try {
        // @ts-expect-error - Intentionally testing missing key
        await caller.validateApiKey({ provider: 'openai' });
        expect.fail('Should have thrown validation error for missing key');
      } catch (error) {
        expect(String(error)).toContain('Required');
      }
    });

    it('should validate provider enum values', async () => {
      try {
        // @ts-expect-error - Intentionally testing invalid provider
        await caller.validateApiKey({ provider: 'invalid-provider', key: 'test-key' });
        expect.fail('Should have thrown validation error for invalid provider');
      } catch (error) {
        expect(String(error)).toContain('Invalid enum value');
      }
    });

    it('should require non-empty key string', async () => {
      try {
        await caller.validateApiKey({ provider: 'openai', key: '' });
        expect.fail('Should have thrown validation error for empty key');
      } catch (error) {
        expect(String(error)).toContain('String must contain at least 1 character(s)');
      }
    });
  });

  describe('getModels parameter schema', () => {
    it('should accept correct parameters { provider, key }', async () => {
      const validInput = { provider: 'openai' as const, key: 'test-key' };
      
      try {
        await caller.getModels(validInput);
      } catch (error) {
        // Should fail at API level, not schema validation
        expect(String(error)).not.toContain('Required');
        expect(String(error)).not.toContain('path');
      }
    });

    it('should reject incorrect parameters { provider, apiKey }', async () => {
      const invalidInput = { provider: 'openai' as const, apiKey: 'test-key' };
      
      try {
        // @ts-expect-error - Intentionally testing incorrect parameter name
        await caller.getModels(invalidInput);
        expect.fail('Should have thrown validation error for missing "key" parameter');
      } catch (error) {
        expect(String(error)).toContain('Required');
        expect(String(error)).toContain('key');
      }
    });
  });

  describe('validateAllKeys parameter schema', () => {
    it('should accept correct parameters with all provider keys', async () => {
      const validInput = {
        openai: 'openai-key',
        google: 'google-key', 
        anthropic: 'anthropic-key',
        grok: 'grok-key'
      };
      
      try {
        await caller.validateAllKeys(validInput);
      } catch (error) {
        // Should fail at API level, not schema validation
        expect(String(error)).not.toContain('Required');
      }
    });

    it('should accept empty strings for optional providers', async () => {
      const validInput = {
        openai: 'openai-key',
        google: '',
        anthropic: '',
        grok: '' // grok is optional with default
      };
      
      try {
        await caller.validateAllKeys(validInput);
      } catch (error) {
        // Should not be a schema validation error
        expect(String(error)).not.toContain('Required');
      }
    });

    it('should reject if using incorrect parameter names', async () => {
      // This would catch if someone tries to use different parameter names
      const invalidInput = {
        openaiKey: 'openai-key',  // Wrong parameter name
        googleKey: 'google-key',  // Wrong parameter name
        anthropicKey: 'anthropic-key',  // Wrong parameter name
        grokKey: 'grok-key'  // Wrong parameter name
      };
      
      try {
        // @ts-expect-error - Intentionally testing incorrect parameter names
        await caller.validateAllKeys(invalidInput);
        expect.fail('Should have thrown validation error for incorrect parameter names');
      } catch (error) {
        expect(String(error)).toContain('Required');
      }
    });
  });

  describe('Schema consistency check', () => {
    it('should ensure all validation endpoints use consistent parameter naming', () => {
      // Extract the input schemas from the router
      const procedures = validationRouter._def.procedures;
      
      const validateApiKeySchema = procedures.validateApiKey._def.inputs[0];
      const getModelsSchema = procedures.getModels._def.inputs[0];
      
      // Both should expect 'key' parameter, not 'apiKey'
      expect(validateApiKeySchema).toBeInstanceOf(z.ZodObject);
      expect(getModelsSchema).toBeInstanceOf(z.ZodObject);
      
      // Parse a test object to verify the schemas expect 'key'
      const testValid = { provider: 'openai', key: 'test' };
      const testInvalid = { provider: 'openai', apiKey: 'test' };
      
      // Should successfully parse with 'key'
      expect(() => validateApiKeySchema.parse(testValid)).not.toThrow();
      expect(() => getModelsSchema.parse(testValid)).not.toThrow();
      
      // Should fail to parse with 'apiKey' 
      expect(() => validateApiKeySchema.parse(testInvalid)).toThrow();
      expect(() => getModelsSchema.parse(testInvalid)).toThrow();
    });
  });
});







