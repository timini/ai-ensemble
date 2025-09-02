import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import cosineSimilarity from "cosine-similarity";
import { OpenAIProvider } from "~/server/ai-providers/OpenAIProvider";
import { GoogleProvider } from "~/server/ai-providers/GoogleProvider";
import { AnthropicProvider } from "~/server/ai-providers/AnthropicProvider";

const ProviderEnum = z.enum(["openai", "google", "anthropic"]);

// Helper function to calculate agreement scores
export async function calculateAgreement(
  openaiProvider: OpenAIProvider,
  responses: { openai: string; google: string; anthropic: string }
): Promise<{ og: number; ga: number; ao: number }> {
  try {
    const texts = [responses.openai, responses.google, responses.anthropic];
    
    // Don't make an API call if any of the inputs are empty or just error messages
    if (texts.some(t => !t || t.startsWith("Error:"))) {
        return { og: 0, ga: 0, ao: 0 };
    }

    const embeddingResponse = await openaiProvider.createEmbedding(texts);

    const [vecO, vecG, vecA] = embeddingResponse;

    if (!vecO || !vecG || !vecA) {
        return { og: 0, ga: 0, ao: 0 };
    }

    const og = cosineSimilarity(vecO, vecG);
    const ga = cosineSimilarity(vecG, vecA);
    const ao = cosineSimilarity(vecA, vecO);

    return { og, ga, ao };
  } catch (error) {
    console.error("Failed to calculate agreement scores:", error);
    return { og: 0, ga: 0, ao: 0 };
  }
}

export function instantiateAIClients(keys: { openai: string; google: string; anthropic: string }) {
  const openaiProvider = new OpenAIProvider(keys.openai);
  const googleProvider = new GoogleProvider(keys.google);
  const anthropicProvider = new AnthropicProvider(keys.anthropic);
  return { openaiProvider, googleProvider, anthropicProvider };
}

export async function makeParallelAPICalls(
  openaiProvider: OpenAIProvider,
  googleProvider: GoogleProvider,
  anthropicProvider: AnthropicProvider,
  prompt: string,
  _models: { openai: string; google: string; anthropic: string }
) {
  const [openaiResult, googleResult, anthropicResult] =
    await Promise.allSettled([
      openaiProvider.generateContent(prompt),
      googleProvider.generateContent(prompt),
      anthropicProvider.generateContent(prompt),
    ]);

  return {
      openai: openaiResult.status === 'fulfilled' ? openaiResult.value ?? "" : `Error: ${openaiResult.reason.message}`,
      google: googleResult.status === 'fulfilled' ? googleResult.value ?? "" : `Error: ${googleResult.reason.message}`,
      anthropic: anthropicResult.status === 'fulfilled' ? anthropicResult.value ?? "" : `Error: ${anthropicResult.reason.message}`,
  };
}

export async function callSummarizerAI(
  summarizer: { provider: "openai" | "google" | "anthropic"; model: string },
  keys: { openai: string; google: string; anthropic: string },
  openaiProvider: OpenAIProvider,
  googleProvider: GoogleProvider,
  anthropicProvider: AnthropicProvider,
  summarizerPrompt: string
): Promise<string> {
  let consensusResponse = "";
  try {
    switch (summarizer.provider) {
      case "openai": {
        if (!keys.openai) throw new Error("OpenAI key not provided for summarizer.");
        consensusResponse = await openaiProvider.generateContent(summarizerPrompt);
        break;
      }
      case "google": {
        if (!keys.google) throw new Error("Google key not provided for summarizer.");
        consensusResponse = await googleProvider.generateContent(summarizerPrompt);
        break;
      }
      case "anthropic": {
        if (!keys.anthropic) throw new Error("Anthropic key not provided for summarizer.");
        consensusResponse = await anthropicProvider.generateContent(summarizerPrompt);
        break;
      }
    }
  } catch (error) {
      console.error("Summarization error:", error);
      consensusResponse = "The summarization process failed.";
      if (error instanceof Error) {
        consensusResponse += ` Details: ${error.message}`;
      }
  }
  return consensusResponse;
}

export const ensembleRouter = createTRPCRouter({
  query: publicProcedure
    .input(
      z.object({
        prompt: z.string(),
        keys: z.object({
          openai: z.string().min(1, "OpenAI API key is required."),
          google: z.string().min(1, "Google API key is required."),
          anthropic: z.string().min(1, "Anthropic API key is required."),
        }),
        models: z.object({
          openai: z.string(),
          google: z.string(),
          anthropic: z.string(),
        }),
        summarizer: z.object({
          provider: ProviderEnum,
          model: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { prompt, keys, models: _models, summarizer } = input;

      // Helper function to instantiate AI clients
      function instantiateAIClients(keys: { openai: string; google: string; anthropic: string }) {
        const openaiProvider = new OpenAIProvider(keys.openai);
        const googleProvider = new GoogleProvider(keys.google);
        const anthropicProvider = new AnthropicProvider(keys.anthropic);
        return { openaiProvider, googleProvider, anthropicProvider };
      }

      const { openaiProvider, googleProvider, anthropicProvider } = instantiateAIClients(keys);

      // 2. Make parallel API calls
      const individualResponses = await makeParallelAPICalls(openaiProvider, googleProvider, anthropicProvider, prompt, _models);

      // 3. Calculate agreement scores
      const agreementScores = await calculateAgreement(openaiProvider, individualResponses);

      // 4. Construct summarizer prompt
      const summarizerPrompt = `
        Three different AI models provided the following responses:

        ---
        OpenAI Response:
        ${individualResponses.openai}
        ---
        Google Gemini Response:
        ${individualResponses.google}
        ---
        Anthropic Claude Response:
        ${individualResponses.anthropic}
        ---

        Your task is to synthesize these three responses into a single, comprehensive, and well-structured "consensus" answer. The answer should integrate the key points from all three sources, resolve any contradictions, and provide a final response that is more complete than any single answer. Format the entire response as Markdown, including headings, lists, and bold text where appropriate.
      `;

            const consensusResponse = await callSummarizerAI(summarizer, keys, openaiProvider, googleProvider, anthropicProvider, summarizerPrompt);

      // 6. Return the final result
      return {
        consensusResponse,
        individualResponses,
        agreementScores,
      };
    }),
});