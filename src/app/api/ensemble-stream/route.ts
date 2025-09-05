import { z } from "zod";
import type { NextRequest } from "next/server";
import { OpenAIProvider } from "@/server/ai-providers/OpenAIProvider";
import { GoogleProvider } from "@/server/ai-providers/GoogleProvider";
import { AnthropicProvider } from "@/server/ai-providers/AnthropicProvider";
import { GrokProvider } from "@/server/ai-providers/GrokProvider";
import type { IAIProvider } from "@/server/ai-providers/IAIProvider";
import { calculateAgreement } from "@/server/api/routers/ensemble";



const ProviderEnum = z.enum(["openai", "google", "anthropic", "grok"]);

const StreamRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  keys: z.object({
    openai: z.string().optional().default(""),
    google: z.string().optional().default(""),
    anthropic: z.string().optional().default(""),
    grok: z.string().optional().default(""),
  }),
  models: z.object({
    openai: z.string().optional().default(""),
    google: z.string().optional().default(""),
    anthropic: z.string().optional().default(""),
    grok: z.string().optional().default(""),
  }),
  summarizer: z.object({
    provider: ProviderEnum,
    model: z.string(),
  }),
}).refine((data) => {
  // At least one provider must have a key
  const hasKeys = Object.values(data.keys).some(key => key && key.trim().length > 0);
  return hasKeys;
}, {
  message: "At least one API key is required",
  path: ["keys"]
});

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await req.json();
    const input = StreamRequestSchema.parse(body);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      // eslint-disable-next-line sonarjs/cognitive-complexity
      async start(controller) {
        try {
          // Determine which providers have valid keys
          const availableProviders = {
            openai: input.keys.openai.trim().length > 0,
            google: input.keys.google.trim().length > 0,
            anthropic: input.keys.anthropic.trim().length > 0,
            grok: input.keys.grok.trim().length > 0,
          };

          // Instantiate AI clients only for providers with keys
          const providers: Record<string, IAIProvider> = {};
          if (availableProviders.openai) {
            providers.openai = new OpenAIProvider(input.keys.openai);
          }
          if (availableProviders.google) {
            providers.google = new GoogleProvider(input.keys.google);
          }
          if (availableProviders.anthropic) {
            providers.anthropic = new AnthropicProvider(input.keys.anthropic);
          }
          if (availableProviders.grok) {
            providers.grok = new GrokProvider(input.keys.grok);
          }

          // Check if we have at least one provider
          const activeProviders = Object.keys(providers);
          if (activeProviders.length === 0) {
            throw new Error('At least one API key is required to process your request.');
          }

          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: `Starting parallel AI queries with ${activeProviders.join(', ')}...` 
          })}\n\n`));

          // Store individual responses for agreement calculation
          const individualResponses = {
            openai: '',
            google: '',
            anthropic: '',
            grok: ''
          };

          // Helper function to send data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sendData = (type: string, data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
          };

          // Create streaming promises for active providers only
          const streamPromises = [];

          // OpenAI stream
          if (availableProviders.openai) {
            streamPromises.push((async () => {
              try {
                sendData('provider_start', { provider: 'openai' });
                for await (const chunk of providers.openai!.generateContentStream(input.prompt, input.models.openai)) {
                  individualResponses.openai += chunk;
                  sendData('chunk', { provider: 'openai', content: chunk });
                }
                sendData('provider_complete', { provider: 'openai', response: individualResponses.openai });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                individualResponses.openai = `Error: ${errorMsg}`;
                sendData('provider_error', { provider: 'openai', error: errorMsg });
              }
            })());
          } else {
            individualResponses.openai = 'Provider not available (no API key)';
          }

          // Google stream
          if (availableProviders.google) {
            streamPromises.push((async () => {
              try {
                sendData('provider_start', { provider: 'google' });
                for await (const chunk of providers.google!.generateContentStream(input.prompt, input.models.google)) {
                  individualResponses.google += chunk;
                  sendData('chunk', { provider: 'google', content: chunk });
                }
                sendData('provider_complete', { provider: 'google', response: individualResponses.google });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                individualResponses.google = `Error: ${errorMsg}`;
                sendData('provider_error', { provider: 'google', error: errorMsg });
              }
            })());
          } else {
            individualResponses.google = 'Provider not available (no API key)';
          }

          // Anthropic stream
          if (availableProviders.anthropic) {
            streamPromises.push((async () => {
              try {
                sendData('provider_start', { provider: 'anthropic' });
                for await (const chunk of providers.anthropic!.generateContentStream(input.prompt, input.models.anthropic)) {
                  individualResponses.anthropic += chunk;
                  sendData('chunk', { provider: 'anthropic', content: chunk });
                }
                sendData('provider_complete', { provider: 'anthropic', response: individualResponses.anthropic });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                individualResponses.anthropic = `Error: ${errorMsg}`;
                sendData('provider_error', { provider: 'anthropic', error: errorMsg });
              }
            })());
          } else {
            individualResponses.anthropic = 'Provider not available (no API key)';
          }

          // Grok stream
          if (availableProviders.grok) {
            streamPromises.push((async () => {
              try {
                sendData('provider_start', { provider: 'grok' });
                for await (const chunk of providers.grok!.generateContentStream(input.prompt, input.models.grok)) {
                  individualResponses.grok += chunk;
                  sendData('chunk', { provider: 'grok', content: chunk });
                }
                sendData('provider_complete', { provider: 'grok', response: individualResponses.grok });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                individualResponses.grok = `Error: ${errorMsg}`;
                sendData('provider_error', { provider: 'grok', error: errorMsg });
              }
            })());
          } else {
            individualResponses.grok = 'Provider not available (no API key)';
          }

          // Wait for all streams to complete
          await Promise.all(streamPromises);

          // Calculate agreement scores
          sendData('status', { message: 'Calculating agreement scores...' });
          // Use OpenAI provider for agreement calculation if available, otherwise skip
          const dynamicAgreementScores = providers.openai 
            ? await calculateAgreement(providers.openai as OpenAIProvider, individualResponses)
            : [];
          
          // Send agreement scores directly (this is the legacy endpoint)
          sendData('agreement', { scores: dynamicAgreementScores });

          // Generate consensus response
          sendData('status', { message: 'Generating consensus response...' });
          
          // Only include responses from active providers in the summary
          const responseList = [];
          if (availableProviders.openai && individualResponses.openai && !individualResponses.openai.startsWith('Error:') && !individualResponses.openai.includes('not available')) {
            responseList.push(`OpenAI Response:\n${individualResponses.openai}`);
          }
          if (availableProviders.google && individualResponses.google && !individualResponses.google.startsWith('Error:') && !individualResponses.google.includes('not available')) {
            responseList.push(`Google Response:\n${individualResponses.google}`);
          }
          if (availableProviders.anthropic && individualResponses.anthropic && !individualResponses.anthropic.startsWith('Error:') && !individualResponses.anthropic.includes('not available')) {
            responseList.push(`Anthropic Response:\n${individualResponses.anthropic}`);
          }
          if (availableProviders.grok && individualResponses.grok && !individualResponses.grok.startsWith('Error:') && !individualResponses.grok.includes('not available')) {
            responseList.push(`Grok Response:\n${individualResponses.grok}`);
          }

          const summarizerPrompt = responseList.length > 1 
            ? `Different AI models provided the following responses:\n\n${responseList.join('\n\n---\n\n')}\n\n---\n\nPlease provide a well-structured consensus response that synthesizes the best insights from all responses. Focus on accuracy, completeness, and clarity.`
            : `Based on the following AI response, please provide a well-structured and comprehensive answer:\n\n${responseList[0] ?? 'No valid responses received.'}\n\n---\n\nPlease enhance and clarify this response while maintaining accuracy.`;

          // Stream the consensus response
          sendData('consensus_start', {});
          let consensusResponse = '';

          // Use the summarizer provider if available, otherwise use the first available provider
          const consensusProvider = availableProviders[input.summarizer.provider] 
            ? providers[input.summarizer.provider]!
            : Object.values(providers)[0]!;

          for await (const chunk of consensusProvider.generateContentStream(summarizerPrompt, input.summarizer.model)) {
            consensusResponse += chunk;
            sendData('consensus_chunk', { content: chunk });
          }

          // Send final complete response
          sendData('complete', {
            consensusResponse,
            agreementScores: dynamicAgreementScores,
            individualResponses
          });

          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
