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
const GOOGLE_MODELS = ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"];
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
    .filter(model => model.id.includes("gpt"))
    .map(model => model.id)
    .sort()
    .reverse();
}

async function validateGoogle(key: string) {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  await model.countTokens("test");
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
            if (input.provider === 'google') return GOOGLE_MODELS;
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
        console.log("Starting key validation with Promise.allSettled...");
        const results = await Promise.allSettled([
            input.openai ? validateOpenAI(input.openai) : Promise.reject(),
            input.google ? validateGoogle(input.google) : Promise.reject(),
            input.anthropic ? validateAnthropic(input.anthropic) : Promise.reject(),
        ]);
        console.log("Key validation results:", results);

        const statuses: Record<Provider, KeyStatus> = {
            openai: results[0].status === 'fulfilled' ? 'valid' : 'invalid',
            google: results[1].status === 'fulfilled' ? 'valid' : 'invalid',
            anthropic: results[2].status === 'fulfilled' ? 'valid' : 'invalid',
        };

        console.log("Starting model list fetching with Promise.allSettled...");
        const modelListsResults = await Promise.allSettled([
            statuses.openai === 'valid' ? fetchOpenAIModels(input.openai) : Promise.resolve(FALLBACK_MODELS.openai),
            statuses.google === 'valid' ? Promise.resolve(GOOGLE_MODELS) : Promise.resolve(GOOGLE_MODELS),
            statuses.anthropic === 'valid' ? Promise.resolve(ANTHROPIC_MODELS) : Promise.resolve(ANTHROPIC_MODELS),
        ]);
        console.log("Model list fetching results:", modelListsResults);

        const modelLists = {
            openai: modelListsResults[0].status === 'fulfilled' ? modelListsResults[0].value : FALLBACK_MODELS.openai,
            google: modelListsResults[1].status === 'fulfilled' ? modelListsResults[1].value : GOOGLE_MODELS,
            anthropic: modelListsResults[2].status === 'fulfilled' ? modelListsResults[2].value : ANTHROPIC_MODELS,
        };

        // If a key is empty, its status should be 'unchecked' not 'invalid'
        if (!input.openai) statuses.openai = 'unchecked';
        if (!input.google) statuses.google = 'unchecked';
        if (!input.anthropic) statuses.anthropic = 'unchecked';

        console.log("Returning from validateAllKeys. Statuses:", statuses, "Model Lists:", modelLists);
        return { statuses, modelLists };
    }),
});