import { type Provider } from "@/types/api";

// Only text generation models - excluding image, embedding, or other non-text models
export const FALLBACK_MODELS: Record<Provider, string[]> = {
    openai: ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
    google: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro-latest", "gemini-1.5-flash-latest"],
    anthropic: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    grok: ["grok-beta", "grok-2-latest", "grok-2-public-beta"],
};
