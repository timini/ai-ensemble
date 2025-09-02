import type { Provider } from "~/app/_components/ProviderSettings";

export interface ModelConfiguration {
  id: string; // Unique identifier like "openai-gpt4" or "google-gemini-pro"
  name: string; // Display name like "GPT-4 Turbo" or "Gemini 2.5 Pro"
  provider: Provider;
  model: string; // The actual model ID for the API
  apiKey: string;
  enabled: boolean;
}

export interface ModelConfigurationTemplate {
  id: string;
  name: string;
  provider: Provider;
  model: string;
  description?: string;
  recommended?: boolean;
}

// Pre-defined templates users can choose from
export const MODEL_TEMPLATES: ModelConfigurationTemplate[] = [
  // OpenAI Models
  {
    id: "openai-gpt4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    model: "gpt-4-turbo",
    description: "Latest GPT-4 model with improved performance",
    recommended: true,
  },
  {
    id: "openai-gpt4",
    name: "GPT-4",
    provider: "openai", 
    model: "gpt-4",
    description: "Original GPT-4 model",
  },
  {
    id: "openai-gpt35-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    model: "gpt-3.5-turbo",
    description: "Fast and cost-effective model",
  },

  // Google Models
  {
    id: "google-gemini-25-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    model: "gemini-2.5-flash",
    description: "Latest Gemini model, optimized for speed",
    recommended: true,
  },
  {
    id: "google-gemini-25-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    model: "gemini-2.5-pro", 
    description: "Latest Gemini model, optimized for quality",
    recommended: true,
  },
  {
    id: "google-gemini-15-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    model: "gemini-1.5-pro-latest",
    description: "Previous generation Gemini Pro",
  },
  {
    id: "google-gemini-15-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    model: "gemini-1.5-flash-latest",
    description: "Previous generation Gemini Flash",
  },

  // Anthropic Models  
  {
    id: "anthropic-claude-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    model: "claude-3-opus-20240229",
    description: "Most capable Claude model",
    recommended: true,
  },
  {
    id: "anthropic-claude-sonnet",
    name: "Claude 3 Sonnet", 
    provider: "anthropic",
    model: "claude-3-sonnet-20240229",
    description: "Balanced performance and speed",
  },
  {
    id: "anthropic-claude-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
    description: "Fastest Claude model",
  },

  // Grok Models
  {
    id: "grok-beta",
    name: "Grok Beta",
    provider: "grok",
    model: "grok-beta",
    description: "Latest Grok model from X.AI",
    recommended: true,
  },
  {
    id: "grok-2-latest",
    name: "Grok 2 Latest",
    provider: "grok", 
    model: "grok-2-latest",
    description: "Grok 2 model",
  },
];

// Helper functions
export function getTemplatesByProvider(provider: Provider): ModelConfigurationTemplate[] {
  return MODEL_TEMPLATES.filter(template => template.provider === provider);
}

export function getProviderColor(provider: Provider): string {
  const colors = {
    openai: 'hsl(140, 70%, 60%)', // Green
    google: 'hsl(220, 90%, 60%)', // Blue  
    anthropic: 'hsl(30, 80%, 60%)', // Orange
    grok: 'hsl(280, 70%, 60%)', // Purple
  };
  return colors[provider] ?? 'hsl(200, 70%, 60%)';
}

export function createDefaultConfigurations(): ModelConfiguration[] {
  return [
    {
      id: "openai-gpt4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      model: "gpt-4-turbo",
      apiKey: "",
      enabled: true,
    },
    {
      id: "google-gemini-25-flash", 
      name: "Gemini 2.5 Flash",
      provider: "google",
      model: "gemini-2.5-flash",
      apiKey: "",
      enabled: true,
    },
    {
      id: "anthropic-claude-opus",
      name: "Claude 3 Opus", 
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      apiKey: "",
      enabled: true,
    },
  ];
}
