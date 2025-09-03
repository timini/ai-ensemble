
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { TRPCError } from "@trpc/server";
import { type Provider, type KeyStatus } from "~/app/_components/ProviderSettings";
import { FALLBACK_MODELS } from "~/utils/constants";

const ProviderEnum = z.enum(["openai", "google", "anthropic", "grok"]);

// Hardcoded lists as fallback and for providers without a list API
// Only text generation models - excluding image, embedding, or other non-text models
const GOOGLE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro", 
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b-latest",
  "gemini-1.5-flash-8b"
];
const ANTHROPIC_MODELS = ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"];
const GROK_MODELS = ["grok-beta", "grok-2-latest", "grok-2-public-beta", "grok-2", "grok-1"];

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
  try {
    // Use the REST API to fetch models since the SDK doesn't expose listModels
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    
    if (!response.ok) {
      console.log("Google models fetch failed, using fallback list");
      return GOOGLE_MODELS;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();
    console.log("Google API response:", data);
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!data.models) {
      console.log("No models found in response, using fallback list");
      return GOOGLE_MODELS;
    }
    
    // Filter for Gemini models that support generateContent
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
    const geminiModels = data.models
      .filter((model: any) => {
        const modelName = model.name?.replace('models/', '');
        return modelName?.includes('gemini') && 
               model.supportedGenerationMethods?.includes('generateContent') &&
               !modelName?.includes('embedding');
      })
      .map((model: any) => model.name?.replace('models/', ''))
      .sort()
      .reverse(); // Latest models first
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
    
    console.log("Filtered Gemini models:", geminiModels);
    
    // Return the dynamic list if we found models, otherwise fallback
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return geminiModels.length > 0 ? geminiModels : GOOGLE_MODELS;
  } catch (error) {
    console.error("Error fetching Google models:", error);
    return GOOGLE_MODELS;
  }
}

async function validateAnthropic(key: string) {
  const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1,
    messages: [{ role: "user", content: "test" }],
  });
}

async function validateGrok(key: string) {
  const modelsToTry = ['grok-2-latest', 'grok-beta', 'grok-2', 'grok-2-public-beta'];
  
  for (const model of modelsToTry) {
    try {
      console.log(`Attempting Grok API validation with model: ${model}`);
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1,
        }),
      });

      console.log(`Grok API response status for ${model}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json() as Record<string, unknown>;
        console.log(`Grok API validation successful with ${model}:`, data);
        return; // Success, exit function
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`Grok API error for ${model}: ${response.status} ${response.statusText} - ${errorText}`);
        
        // If it's a 404, try the next model; if it's auth error, throw immediately
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Grok API authentication error: ${response.status} ${response.statusText}`);
        }
        // Continue to next model for 404 or other errors
      }
    } catch (error) {
      console.error(`validateGrok: Exception with ${model}:`, error);
      // If it's an authentication error, re-throw immediately
      if (error instanceof Error && (error.message.includes('authentication') || error.message.includes('401') || error.message.includes('403'))) {
        throw error;
      }
      // Otherwise, continue to next model
    }
  }
  
  // If we get here, all models failed
  throw new Error('Grok API validation failed: No working models found. This may indicate the API is not available or the key is invalid.');
}


export const validationRouter = createTRPCRouter({
  // (keeping individual validation for on-blur validation)
  validateApiKey: publicProcedure
    .input(z.object({ provider: ProviderEnum, key: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        switch (input.provider) {
          case "openai": 
            await validateOpenAI(input.key); 
            break;
          case "google": 
            await validateGoogle(input.key); 
            break;
          case "anthropic": 
            await validateAnthropic(input.key); 
            break;
          case "grok": 
            await validateGrok(input.key); 
            break;
        }
        return { success: true, error: null };
      } catch (error) {
        console.error(`${input.provider} validation failed:`, error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  getModels: publicProcedure
    .input(z.object({ provider: ProviderEnum, key: z.string().min(1) }))
    .mutation(async ({ input }) => {
        try {
            if (input.provider === 'openai') return await fetchOpenAIModels(input.key);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            if (input.provider === 'google') return await fetchGoogleModels(input.key);
            if (input.provider === 'anthropic') return ANTHROPIC_MODELS;
            if (input.provider === 'grok') return GROK_MODELS;
        } catch (error) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
        // Return fallback on error or for unhandled providers
        if (input.provider === 'google') return GOOGLE_MODELS;
        if (input.provider === 'anthropic') return ANTHROPIC_MODELS;
        if (input.provider === 'grok') return GROK_MODELS;
        return [];
    }),

  // New procedure for efficient parallel validation on page load
  validateAllKeys: publicProcedure
    .input(z.object({
        openai: z.string(),
        google: z.string(),
        anthropic: z.string(),
        grok: z.string().optional().default(""),
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
        if (input.grok?.trim()) {
            validationPromises.push(validateGrok(input.grok));
            keyMappings.push({ index: validationPromises.length - 1, provider: 'grok' });
        }

        console.log("Starting key validation with Promise.allSettled...");
        const results = await Promise.allSettled(validationPromises);
        console.log("Key validation results:", results);

        // Initialize all statuses as unchecked
        const statuses: Record<Provider, KeyStatus> = {
            openai: 'unchecked',
            google: 'unchecked',
            anthropic: 'unchecked',
            grok: 'unchecked',
        };

        // Update statuses based on validation results
        keyMappings.forEach((mapping) => {
            const result = results[mapping.index];
            statuses[mapping.provider] = result?.status === 'fulfilled' ? 'valid' : 'invalid';
        });

        console.log("Starting model list fetching with Promise.allSettled...");
        const modelListsResults = await Promise.allSettled([
            statuses.openai === 'valid' ? fetchOpenAIModels(input.openai) : Promise.resolve(FALLBACK_MODELS.openai),
            statuses.google === 'valid' ? fetchGoogleModels(input.google) : Promise.resolve(GOOGLE_MODELS),
            statuses.anthropic === 'valid' ? Promise.resolve(ANTHROPIC_MODELS) : Promise.resolve(ANTHROPIC_MODELS),
            statuses.grok === 'valid' ? Promise.resolve(GROK_MODELS) : Promise.resolve(GROK_MODELS),
        ]);
        console.log("Model list fetching results:", modelListsResults);

        const modelLists = {
            openai: modelListsResults[0].status === 'fulfilled' ? modelListsResults[0].value : FALLBACK_MODELS.openai,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            google: modelListsResults[1].status === 'fulfilled' ? modelListsResults[1].value : GOOGLE_MODELS,
            anthropic: modelListsResults[2].status === 'fulfilled' ? modelListsResults[2].value : ANTHROPIC_MODELS,
            grok: modelListsResults[3].status === 'fulfilled' ? modelListsResults[3].value : GROK_MODELS,
        };

        console.log("Returning from validateAllKeys. Statuses:", statuses, "Model Lists:", modelLists);
        return { statuses, modelLists };
    }),
});