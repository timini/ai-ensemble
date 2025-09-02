/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { TRPCError } from "@trpc/server";
import { type Provider, type KeyStatus } from "~/app/_components/ProviderSettings";
import { FALLBACK_MODELS } from "~/utils/constants";

const ProviderEnum = z.enum(["openai", "google", "anthropic"]);

// Hardcoded lists as fallback and for providers without a list API
// Only text generation models - excluding image, embedding, or other non-text models
const GOOGLE_MODELS = [
  "gemini-2.5-flash-exp",
  "gemini-2.0-flash-exp", 
  "gemini-1.5-pro-latest", 
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-flash"
];
const ANTHROPIC_MODELS = ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"];

// --- Individual Validation/Fetching Logic (reused by the parallel procedure) ---

async function validateOpenAI(key: string) {
  const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  await openai.models.list();
}

async function fetchOpenAIModels(key: string) {
  const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  const models = await openai.models.list();
  return models.data
    .filter(model => {
      // Only include text generation models, exclude image, embedding, audio, and other non-text models
      return model.id.includes("gpt") && 
             !model.id.includes("dall-e") && 
             !model.id.includes("whisper") && 
             !model.id.includes("tts") && 
             !model.id.includes("embedding") &&
             !model.id.includes("moderation") &&
             !model.id.includes("realtime");
    })
    .map(model => model.id)
    .sort()
    .reverse();
}

async function validateGoogle(key: string) {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  await model.countTokens("test");
}

async function fetchGoogleModels(key: string) {
  const genAI = new GoogleGenerativeAI(key);
  const models = await genAI.listModels();
  return models
    .filter(model => {
      // Only include text generation models, exclude embedding and other non-text models
      return model.name.includes("gemini") && 
             model.supportedGenerationMethods?.includes("generateContent") &&
             !model.name.includes("embedding");
    })
    .map(model => model.name.replace("models/", "")) // Remove "models/" prefix
    .sort()
    .reverse(); // Latest models first
}

async function validateAnthropic(key: string) {
  const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1,
    messages: [{ role: "user", content: "test" }],
  });
}


export const validationRouter = createTRPCRouter({
  // (keeping individual validation for on-blur validation)
  validateApiKey: publicProcedure
    .input(z.object({ provider: ProviderEnum, key: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        switch (input.provider) {
          case "openai": await validateOpenAI(input.key); break;
          case "google": await validateGoogle(input.key); break;
          case "anthropic": await validateAnthropic(input.key); break;
        }
        return { success: true, error: null };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  getModels: publicProcedure
    .input(z.object({ provider: ProviderEnum, key: z.string().min(1) }))
    .query(async ({ input }) => {
        try {
            if (input.provider === 'openai') return await fetchOpenAIModels(input.key);
            if (input.provider === 'google') return await fetchGoogleModels(input.key);
            if (input.provider === 'anthropic') return ANTHROPIC_MODELS;
        } catch (error) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
        // Return fallback on error or for unhandled providers
        if (input.provider === 'google') return GOOGLE_MODELS;
        if (input.provider === 'anthropic') return ANTHROPIC_MODELS;
        return [];
    }),

  // New procedure for efficient parallel validation on page load
  validateAllKeys: publicProcedure
    .input(z.object({
        openai: z.string(),
        google: z.string(),
        anthropic: z.string(),
    }))
    .mutation(async ({ input }) => {
        console.log("Entering validateAllKeys procedure. Input:", input);
        
        // Only validate keys that are not empty
        const validationPromises: Promise<void>[] = [];
        const keyMappings: { index: number; provider: Provider }[] = [];
        
        if (input.openai?.trim()) {
            validationPromises.push(validateOpenAI(input.openai));
            keyMappings.push({ index: validationPromises.length - 1, provider: 'openai' });
        }
        if (input.google?.trim()) {
            validationPromises.push(validateGoogle(input.google));
            keyMappings.push({ index: validationPromises.length - 1, provider: 'google' });
        }
        if (input.anthropic?.trim()) {
            validationPromises.push(validateAnthropic(input.anthropic));
            keyMappings.push({ index: validationPromises.length - 1, provider: 'anthropic' });
        }

        console.log("Starting key validation with Promise.allSettled...");
        const results = await Promise.allSettled(validationPromises);
        console.log("Key validation results:", results);

        // Initialize all statuses as unchecked
        const statuses: Record<Provider, KeyStatus> = {
            openai: 'unchecked',
            google: 'unchecked',
            anthropic: 'unchecked',
        };

        // Update statuses based on validation results
        keyMappings.forEach((mapping, i) => {
            const result = results[mapping.index];
            statuses[mapping.provider] = result?.status === 'fulfilled' ? 'valid' : 'invalid';
        });

        console.log("Starting model list fetching with Promise.allSettled...");
        const modelListsResults = await Promise.allSettled([
            statuses.openai === 'valid' ? fetchOpenAIModels(input.openai) : Promise.resolve(FALLBACK_MODELS.openai),
            statuses.google === 'valid' ? fetchGoogleModels(input.google) : Promise.resolve(GOOGLE_MODELS),
            statuses.anthropic === 'valid' ? Promise.resolve(ANTHROPIC_MODELS) : Promise.resolve(ANTHROPIC_MODELS),
        ]);
        console.log("Model list fetching results:", modelListsResults);

        const modelLists = {
            openai: modelListsResults[0].status === 'fulfilled' ? modelListsResults[0].value : FALLBACK_MODELS.openai,
            google: modelListsResults[1].status === 'fulfilled' ? modelListsResults[1].value : GOOGLE_MODELS,
            anthropic: modelListsResults[2].status === 'fulfilled' ? modelListsResults[2].value : ANTHROPIC_MODELS,
        };

        console.log("Returning from validateAllKeys. Statuses:", statuses, "Model Lists:", modelLists);
        return { statuses, modelLists };
    }),
});