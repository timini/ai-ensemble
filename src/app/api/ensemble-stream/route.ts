import { z } from "zod";
import type { NextRequest } from "next/server";
import { OpenAIProvider } from "~/server/ai-providers/OpenAIProvider";
import { GoogleProvider } from "~/server/ai-providers/GoogleProvider";
import { AnthropicProvider } from "~/server/ai-providers/AnthropicProvider";
import { calculateAgreement } from "~/server/api/routers/ensemble";

const ProviderEnum = z.enum(["openai", "google", "anthropic"]);

const StreamRequestSchema = z.object({
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
});

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await req.json();
    const input = StreamRequestSchema.parse(body);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Instantiate AI clients
          const openaiProvider = new OpenAIProvider(input.keys.openai);
          const googleProvider = new GoogleProvider(input.keys.google);
          const anthropicProvider = new AnthropicProvider(input.keys.anthropic);

          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Starting parallel AI queries...' })}\n\n`));

          // Store individual responses for agreement calculation
          const individualResponses = {
            openai: '',
            google: '',
            anthropic: ''
          };

          // Helper function to send data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sendData = (type: string, data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
          };

          // Create streaming promises for all providers
          const streamPromises = [
            // OpenAI stream
            (async () => {
              try {
                sendData('provider_start', { provider: 'openai' });
                for await (const chunk of openaiProvider.generateContentStream(input.prompt, input.models.openai)) {
                  individualResponses.openai += chunk;
                  sendData('chunk', { provider: 'openai', content: chunk });
                }
                sendData('provider_complete', { provider: 'openai', response: individualResponses.openai });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                individualResponses.openai = `Error: ${errorMsg}`;
                sendData('provider_error', { provider: 'openai', error: errorMsg });
              }
            })(),

            // Google stream
            (async () => {
              try {
                sendData('provider_start', { provider: 'google' });
                for await (const chunk of googleProvider.generateContentStream(input.prompt, input.models.google)) {
                  individualResponses.google += chunk;
                  sendData('chunk', { provider: 'google', content: chunk });
                }
                sendData('provider_complete', { provider: 'google', response: individualResponses.google });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                individualResponses.google = `Error: ${errorMsg}`;
                sendData('provider_error', { provider: 'google', error: errorMsg });
              }
            })(),

            // Anthropic stream
            (async () => {
              try {
                sendData('provider_start', { provider: 'anthropic' });
                for await (const chunk of anthropicProvider.generateContentStream(input.prompt, input.models.anthropic)) {
                  individualResponses.anthropic += chunk;
                  sendData('chunk', { provider: 'anthropic', content: chunk });
                }
                sendData('provider_complete', { provider: 'anthropic', response: individualResponses.anthropic });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                individualResponses.anthropic = `Error: ${errorMsg}`;
                sendData('provider_error', { provider: 'anthropic', error: errorMsg });
              }
            })(),
          ];

          // Wait for all streams to complete
          await Promise.all(streamPromises);

          // Calculate agreement scores
          sendData('status', { message: 'Calculating agreement scores...' });
          const agreementScores = await calculateAgreement(openaiProvider, individualResponses);
          sendData('agreement', { scores: agreementScores });

          // Generate consensus response
          sendData('status', { message: 'Generating consensus response...' });
          const summarizerPrompt = `
            Three different AI models provided the following responses:

            ---
            OpenAI Response:
            ${individualResponses.openai}

            ---
            Google Response:
            ${individualResponses.google}

            ---
            Anthropic Response:
            ${individualResponses.anthropic}

            ---

            Please provide a well-structured consensus response that synthesizes the best insights from all three responses. Focus on accuracy, completeness, and clarity.
          `;

          // Stream the consensus response
          sendData('consensus_start', {});
          let consensusResponse = '';

          const consensusProvider = input.summarizer.provider === 'openai' ? openaiProvider :
                                  input.summarizer.provider === 'google' ? googleProvider : anthropicProvider;

          for await (const chunk of consensusProvider.generateContentStream(summarizerPrompt, input.summarizer.model)) {
            consensusResponse += chunk;
            sendData('consensus_chunk', { content: chunk });
          }

          // Send final complete response
          sendData('complete', {
            consensusResponse,
            agreementScores,
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
