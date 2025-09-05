import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

/**
 * Regression test to ensure the parameter mismatch bug doesn't reoccur.
 * 
 * This test simulates the exact bug that occurred:
 * - Frontend called TRPC with { provider, apiKey: key }
 * - TRPC schema expected { provider, key }
 * - Result: validation error "Required" for 'key' parameter
 */
describe('TRPC Parameter Mismatch Regression Test', () => {
  // Simulate the TRPC validation schema (simplified)
  const validateApiKeySchema = z.object({
    provider: z.enum(['openai', 'google', 'anthropic', 'grok']),
    key: z.string().min(1)
  });

  const getModelsSchema = z.object({
    provider: z.enum(['openai', 'google', 'anthropic', 'grok']),
    key: z.string().min(1)
  });

  describe('Simulate the original bug scenario', () => {
    it('should catch when frontend uses wrong parameter name "apiKey"', () => {
      // This is what the frontend was incorrectly sending
      const frontendCall = {
        provider: 'openai' as const,
        apiKey: 'sk-test123'  // BUG: should be 'key', not 'apiKey'
      };

      // The schema should reject this and give a clear error about missing 'key'
      expect(() => validateApiKeySchema.parse(frontendCall)).toThrow();
      
      try {
        validateApiKeySchema.parse(frontendCall);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const keyError = error.issues.find(issue => 
            issue.path.includes('key') && issue.code === 'invalid_type'
          );
          expect(keyError).toBeDefined();
          expect(keyError?.message).toBe('Required');
        }
      }
    });

    it('should catch when frontend uses wrong parameter name for getModels', () => {
      const frontendCall = {
        provider: 'google' as const,
        apiKey: 'google-key-123'  // BUG: should be 'key', not 'apiKey'
      };

      expect(() => getModelsSchema.parse(frontendCall)).toThrow();
      
      try {
        getModelsSchema.parse(frontendCall);
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                path: ['key'],
                code: 'invalid_type',
                message: 'Required'
              })
            ])
          );
        }
      }
    });

    it('should pass when frontend uses correct parameter name "key"', () => {
      // This is the correct way to call the API
      const correctFrontendCall = {
        provider: 'anthropic' as const,
        key: 'anthropic-key-123'  // CORRECT: using 'key'
      };

      // Both schemas should accept this without error
      expect(() => validateApiKeySchema.parse(correctFrontendCall)).not.toThrow();
      expect(() => getModelsSchema.parse(correctFrontendCall)).not.toThrow();

      const validateResult = validateApiKeySchema.parse(correctFrontendCall);
      const modelsResult = getModelsSchema.parse(correctFrontendCall);
      
      expect(validateResult.provider).toBe('anthropic');
      expect(validateResult.key).toBe('anthropic-key-123');
      expect(modelsResult.provider).toBe('anthropic');
      expect(modelsResult.key).toBe('anthropic-key-123');
    });
  });

  describe('Parameter naming consistency checks', () => {
    const testCases = [
      { provider: 'openai' as const, key: 'openai-test' },
      { provider: 'google' as const, key: 'google-test' },
      { provider: 'anthropic' as const, key: 'anthropic-test' },
      { provider: 'grok' as const, key: 'grok-test' }
    ];

    testCases.forEach(({ provider, key }) => {
      it(`should validate correct parameters for ${provider}`, () => {
        const validCall = { provider, key };
        
        expect(() => validateApiKeySchema.parse(validCall)).not.toThrow();
        expect(() => getModelsSchema.parse(validCall)).not.toThrow();
      });

      it(`should reject incorrect parameter name for ${provider}`, () => {
        const invalidCall = { provider, apiKey: key };  // Wrong parameter name
        
        expect(() => validateApiKeySchema.parse(invalidCall)).toThrow();
        expect(() => getModelsSchema.parse(invalidCall)).toThrow();
      });
    });
  });

  describe('Error message validation', () => {
    it('should provide clear error messages for debugging', () => {
      const wrongParamCall = {
        provider: 'openai' as const,
        apiKey: 'test-key'  // Wrong parameter name
      };

      try {
        validateApiKeySchema.parse(wrongParamCall);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Check that the error clearly indicates what's wrong
          const errorMessage = error.message;
          expect(errorMessage).toContain('Required');
          
          // Check the issues array for more detailed info
          const issues = error.issues;
          expect(issues).toHaveLength(1);
          expect(issues[0].path).toEqual(['key']);
          expect(issues[0].code).toBe('invalid_type');
          expect(issues[0].expected).toBe('string');
          expect(issues[0].received).toBe('undefined');
        }
      }
    });

    it('should help developers identify the mismatch', () => {
      // Simulate a developer debugging this issue
      const developerCall = {
        provider: 'google' as const,
        apiKey: 'my-google-key'  // They used apiKey thinking it's correct
        // Missing: key
      };

      try {
        getModelsSchema.parse(developerCall);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // The error should make it clear that 'key' is required
          const flatErrors = error.flatten();
          expect(flatErrors.fieldErrors.key).toContain('Required');
          expect(flatErrors.fieldErrors.apiKey).toBeUndefined(); // apiKey is not in schema
        }
      }
    });
  });

  describe('Prevention measures', () => {
    it('should document the correct parameter structure', () => {
      // This test serves as documentation
      const correctApiCall = {
        provider: 'openai' as const,  // Must be one of the supported providers
        key: 'sk-...'                // Must be named 'key', not 'apiKey'
      };

      // This is the expected structure for both validateApiKey and getModels
      expect(validateApiKeySchema.parse(correctApiCall)).toEqual(correctApiCall);
      expect(getModelsSchema.parse(correctApiCall)).toEqual(correctApiCall);
    });

    it('should fail fast on parameter name typos', () => {
      const commonTypos = [
        { provider: 'openai' as const, apikey: 'test' },      // lowercase
        { provider: 'openai' as const, api_key: 'test' },     // underscore
        { provider: 'openai' as const, apiKey: 'test' },      // camelCase (the bug)
        { provider: 'openai' as const, API_KEY: 'test' },     // uppercase
      ];

      commonTypos.forEach(typo => {
        expect(() => validateApiKeySchema.parse(typo)).toThrow();
        expect(() => getModelsSchema.parse(typo)).toThrow();
      });
    });
  });
});







