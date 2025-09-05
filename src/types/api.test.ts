/**
 * Compile-time type safety tests for API responses
 * 
 * These tests ensure TypeScript catches response format mismatches at compile time.
 * If the backend changes response format without updating types, these will fail.
 */

import { describe, it, expectTypeOf } from 'vitest';
import { 
  type ApiKeyValidationResponse,
  type ModelListResponse,
  type ValidateAllKeysResponse,
  ApiKeyValidationResponseSchema,
  ModelListResponseSchema,
  ValidateAllKeysResponseSchema,
} from './api';

describe('API Response Type Safety', () => {
  describe('ApiKeyValidationResponse', () => {
    it('should have correct shape', () => {
      const response: ApiKeyValidationResponse = {
        success: true,
        error: null,
      };

      expectTypeOf(response.success).toEqualTypeOf<boolean>();
      expectTypeOf(response.error).toEqualTypeOf<string | null>();
    });

    it('should validate with schema', () => {
      const validResponse = { success: true, error: null };
      const invalidResponse = { success: true, models: [] }; // Wrong shape!

      expect(ApiKeyValidationResponseSchema.safeParse(validResponse).success).toBe(true);
      expect(ApiKeyValidationResponseSchema.safeParse(invalidResponse).success).toBe(false);
    });
  });

  describe('ModelListResponse', () => {
    it('should be an array of strings', () => {
      const response: ModelListResponse = ['model-1', 'model-2', 'model-3'];

      expectTypeOf(response).toEqualTypeOf<string[]>();
      expectTypeOf(response[0]).toEqualTypeOf<string>();
    });

    it('should NOT accept object with success property', () => {
      // This would be caught at compile time:
      // @ts-expect-error - This should fail because ModelListResponse is string[], not {success, models}
      const wrongResponse: ModelListResponse = { success: true, models: ['model-1'] };
      
      expect(ModelListResponseSchema.safeParse(['model-1', 'model-2']).success).toBe(true);
      expect(ModelListResponseSchema.safeParse({ success: true, models: [] }).success).toBe(false);
    });
  });

  describe('Component usage patterns', () => {
    it('should demonstrate correct frontend usage', () => {
      // This is how the frontend should use the types
      async function correctValidation(apiResponse: ModelListResponse) {
        // ✅ Correct: apiResponse is string[]
        if (apiResponse.length > 0) {
          return { status: 'valid', models: apiResponse };
        }
        return { status: 'invalid', models: [] };
      }

      // This would fail at compile time:
      async function incorrectValidation(apiResponse: ModelListResponse) {
        // @ts-expect-error - Property 'success' does not exist on type 'string[]'
        if (apiResponse.success && apiResponse.models) {
          return { status: 'valid', models: apiResponse.models };
        }
        return { status: 'invalid', models: [] };
      }

      expect(correctValidation).toBeDefined();
      expect(incorrectValidation).toBeDefined();
    });

    it('should demonstrate the bug we just fixed', () => {
      // The old buggy code would look like this:
      function buggyComponentCode(modelsResult: ModelListResponse) {
        // @ts-expect-error - This is the bug! ModelListResponse doesn't have 'success' property
        if (modelsResult.success && modelsResult.models) {
          return modelsResult.models;
        }
        return [];
      }

      // The fixed code:
      function fixedComponentCode(modelsResult: ModelListResponse) {
        // ✅ Correct: modelsResult is already the array
        if (modelsResult.length > 0) {
          return modelsResult;
        }
        return [];
      }

      expect(buggyComponentCode).toBeDefined();
      expect(fixedComponentCode).toBeDefined();
    });
  });
});







