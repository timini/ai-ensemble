/**
 * Shared TypeScript types for API responses
 * 
 * These types ensure compile-time safety between frontend and backend
 * and prevent the kind of runtime errors we just fixed.
 */

import { z } from "zod";

// Validation endpoint response schemas
export const ApiKeyValidationResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().nullable(),
});

export const ModelListResponseSchema = z.array(z.string());

export const ValidateAllKeysResponseSchema = z.object({
  statuses: z.record(z.enum(['valid', 'invalid', 'unchecked'])),
  modelLists: z.record(z.array(z.string())),
});

// Inferred TypeScript types
export type ApiKeyValidationResponse = z.infer<typeof ApiKeyValidationResponseSchema>;
export type ModelListResponse = z.infer<typeof ModelListResponseSchema>;
export type ValidateAllKeysResponse = z.infer<typeof ValidateAllKeysResponseSchema>;

// Provider and validation types
export const ProviderSchema = z.enum(["openai", "google", "anthropic", "grok"]);
export type Provider = z.infer<typeof ProviderSchema>;

export const KeyStatusSchema = z.enum(["valid", "invalid", "unchecked", "validating"]);
export type KeyStatus = z.infer<typeof KeyStatusSchema>;

// API endpoint input schemas
export const ValidateApiKeyInputSchema = z.object({
  provider: ProviderSchema,
  key: z.string().min(1),
});

export const GetModelsInputSchema = z.object({
  provider: ProviderSchema,
  key: z.string().min(1),
});

export type ValidateApiKeyInput = z.infer<typeof ValidateApiKeyInputSchema>;
export type GetModelsInput = z.infer<typeof GetModelsInputSchema>;







