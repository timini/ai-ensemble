import { z } from "zod";
import type { NextRequest } from "next/server";
import { OpenAIProvider } from "~/server/ai-providers/OpenAIProvider";
import { GoogleProvider } from "~/server/ai-providers/GoogleProvider";
import { AnthropicProvider } from "~/server/ai-providers/AnthropicProvider";
import { GrokProvider } from "~/server/ai-providers/GrokProvider";
import type { IAIProvider } from "~/server/ai-providers/IAIProvider";
import type { Provider } from "~/app/_components/ProviderSettings";
import { calculateAgreement } from "~/server/api/routers/ensemble";
import { type AgreementScores } from "~/types/agreement";



const ProviderEnum = z.enum(["openai", "google", "anthropic", "grok"]);

const ModelConfigurationSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: ProviderEnum,
  model: z.string(),
});

const StreamRequestSchemaV2 = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  configurations: z.array(ModelConfigurationSchema).min(2, "At least 2 model configurations required").max(8, "Maximum 8 model configurations allowed"),
  keys: z.record(z.string()), // configId -> apiKey
  models: z.record(z.string()), // configId -> modelName  
  summarizer: z.object({
    configId: z.string(),
    provider: ProviderEnum,
    model: z.string(),
  }),
  existingResponses: z.record(z.string()).optional(), // configId -> response
}).refine((data) => {
  // Ensure all configurations have corresponding keys and models
  return data.configurations.every(config => 
    data.keys[config.id] && data.models[config.id]
  );
}, {
  message: "All configurations must have corresponding API keys and models",
});

function createProviderInstance(provider: Provider, apiKey: string): IAIProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'google':
      return new GoogleProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    case 'grok':
      return new GrokProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${String(provider)}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await req.json();
    console.log("Received streaming request:", JSON.stringify(body, null, 2));
    
    const input = StreamRequestSchemaV2.parse(body);
    console.log("Request parsed successfully");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      // eslint-disable-next-line sonarjs/cognitive-complexity
      async start(controller) {
        try {
          // Instantiate providers for each configuration
          const providerInstances: Record<string, IAIProvider> = {};
          const configResponses: Record<string, string> = {};

          // Create provider instances with their respective API keys
          for (const config of input.configurations) {
            try {
              const apiKey = input.keys[config.id];
              if (!apiKey) {
                throw new Error(`API key missing for configuration ${config.id}`);
              }
              console.log(`Creating provider instance for ${config.id} (${config.provider})`);
              providerInstances[config.id] = createProviderInstance(config.provider, apiKey);
              configResponses[config.id] = '';
              console.log(`Successfully created provider instance for ${config.id}`);
            } catch (error) {
              console.error(`Failed to create provider instance for ${config.id}:`, error);
              configResponses[config.id] = `Error: Failed to initialize ${config.provider} provider - ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          }

          // Helper function to send data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sendData = (type: string, data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
          };

          // Send initial status
          sendData('status', { 
            message: `Starting parallel AI queries with ${input.configurations.length} models...`,
            configurations: input.configurations.map(c => ({ id: c.id, name: c.name, provider: c.provider }))
          });

          // Create streaming promises for each configuration
          const streamPromises = input.configurations.map(config => {
            // Check if we have an existing response for this config
            if (input.existingResponses?.[config.id]) {
              return (async () => {
                configResponses[config.id] = input.existingResponses![config.id]!;
                sendData('config_start', { configId: config.id, name: config.name });
                sendData('config_complete', { 
                  configId: config.id, 
                  name: config.name,
                  response: configResponses[config.id] 
                });
              })();
            }

            const provider = providerInstances[config.id];
            if (!provider) {
              return Promise.resolve();
            }

            return (async () => {
              try {
                sendData('config_start', { configId: config.id, name: config.name });
                
                const modelToUse = input.models[config.id] ?? config.model;
                for await (const chunk of provider.generateContentStream(input.prompt, modelToUse)) {
                  configResponses[config.id] += chunk;
                  sendData('chunk', { 
                    configId: config.id, 
                    content: chunk,
                    name: config.name 
                  });
                }
                
                sendData('config_complete', { 
                  configId: config.id, 
                  name: config.name,
                  response: configResponses[config.id] 
                });
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                configResponses[config.id] = `Error: ${errorMsg}`;
                sendData('config_error', { 
                  configId: config.id, 
                  name: config.name,
                  error: errorMsg 
                });
              }
            })();
          });

          // Wait for all streams to complete
          await Promise.all(streamPromises);

          // --- Calculate Agreement Scores ---
          sendData('status', { message: 'Calculating agreement scores...' });
          sendData('agreement_start', {});
          let agreementScores: AgreementScores = [];

          const successfulResponses = Object.entries(configResponses)
            .filter(([, response]) => response && !response.startsWith('Error:'))
            .reduce((acc, [id, response]) => {
              acc[id] = response;
              return acc;
            }, {} as Record<string, string>);
          
          if (Object.keys(successfulResponses).length >= 2) {
            // Find an OpenAI provider that can generate embeddings. This is a hard requirement for now.
            const embeddingProviderConfig = input.configurations.find(c => c.provider === 'openai');
            const providerForEmbedding = embeddingProviderConfig
              ? providerInstances[embeddingProviderConfig.id]
              : Object.values(providerInstances).find(p => p instanceof OpenAIProvider);

            if (providerForEmbedding && providerForEmbedding instanceof OpenAIProvider) {
              try {
                agreementScores = await calculateAgreement(providerForEmbedding, successfulResponses);
              } catch (error) {
                console.error("Agreement calculation failed:", error);
                sendData('agreement_error', { error: error instanceof Error ? error.message : 'Unknown error' });
              }
            } else {
              console.warn("Agreement calculation skipped: No OpenAI provider available for embeddings.");
              sendData('agreement_error', { error: 'No OpenAI provider available for embeddings' });
            }
          }
          sendData('agreement', { scores: agreementScores });


          // Generate consensus response
          sendData('status', { message: 'Generating consensus response...' });
          
          // Build summarizer prompt with all successful responses
          const validResponses = input.configurations
            .filter(config => {
              const response = configResponses[config.id];
              return response && 
                     response.trim().length > 0 && 
                     !response.startsWith('Error:');
            })
            .map(config => `${config.name} (${config.provider}):\n${configResponses[config.id]}`);

          const summarizerPrompt = validResponses.length > 1
            ? `Different AI models provided the following responses:\n\n${validResponses.join('\n\n---\n\n')}\n\n---\n\nPlease provide a well-structured consensus response that synthesizes the best insights from all responses. Focus on accuracy, completeness, and clarity.`
            : `Based on the following AI response, please provide a well-structured and comprehensive answer:\n\n${validResponses[0] ?? 'No valid responses received.'}\n\n---\n\nPlease enhance and clarify this response while maintaining accuracy.`;

          // Stream the consensus response using the summarizer configuration
          const summarizerProvider = providerInstances[input.summarizer.configId];
          if (!summarizerProvider) {
            throw new Error('Summarizer provider not available');
          }

          sendData('consensus_start', {});
          let consensusResponse = '';
          try {
            for await (const chunk of summarizerProvider.generateContentStream(summarizerPrompt, input.summarizer.model)) {
              consensusResponse += chunk;
              sendData('consensus_chunk', { content: chunk });
            }
          } catch (error) {
              const errorMsg = error instanceof Error ? error.message : "Summarizer failed";
              sendData('consensus_error', { error: errorMsg });
              consensusResponse = `Error: The consensus generation failed. Reason: ${errorMsg}`;
          }

          // Send final complete response
          sendData('complete', {
            consensusResponse,
            agreementScores,
            individualResponses: configResponses,
            configurations: input.configurations,
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
    console.error("Streaming API error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = error instanceof Error && error.message.includes('validation') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'No additional details'
      }),
      { 
        status: statusCode, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
