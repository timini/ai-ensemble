import { z } from "zod";

export const SharedResponseSchema = z.object({
  id: z.string().uuid().optional(), // Generated server-side
  prompt: z.string().min(1, "Prompt is required"),
  timestamp: z.string().datetime().optional(), // Generated server-side
  individualResponses: z.object({
    openai: z.string(),
    google: z.string(),
    anthropic: z.string(),
    grok: z.string(),
  }),
  consensusResponse: z.string(),
  agreementScores: z.object({
    og: z.number().min(0).max(1),
    ga: z.number().min(0).max(1),
    ao: z.number().min(0).max(1),
  }).nullable(),
  models: z.object({
    openai: z.string(),
    google: z.string(),
    anthropic: z.string(),
    grok: z.string(),
  }),
  summarizer: z.object({
    provider: z.enum(["openai", "google", "anthropic", "grok"]),
    model: z.string(),
  }),
});

export type SharedResponse = z.infer<typeof SharedResponseSchema>;

export const ShareRequestSchema = SharedResponseSchema.omit({ id: true, timestamp: true });
export type ShareRequest = z.infer<typeof ShareRequestSchema>;
