export const BUILT_IN_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models from OpenAI',
    className: 'OpenAIProvider',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    color: 'hsl(140, 70%, 60%)', // Green
    defaultModel: 'gpt-3.5-turbo'
  },
  google: {
    id: 'google',
    name: 'Google',
    description: 'Gemini models from Google',
    className: 'GoogleProvider',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    color: 'hsl(220, 90%, 60%)', // Blue
    defaultModel: 'gemini-1.5-flash'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models from Anthropic',
    className: 'AnthropicProvider',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    color: 'hsl(30, 80%, 60%)', // Orange
    defaultModel: 'claude-3-haiku-20240307'
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    description: 'Grok models from X.AI',
    className: 'GrokProvider',
    models: ['grok-beta', 'grok-2-latest', 'grok-2-public-beta'],
    color: 'hsl(280, 70%, 60%)', // Purple
    defaultModel: 'grok-beta'
  }
} as const;

export type BuiltInProviderId = keyof typeof BUILT_IN_PROVIDERS;

export type ProviderConfig = {
  id: string;
  name: string;
  description: string;
  className: string;
  models: string[];
  color: string;
  defaultModel: string;
  enabled: boolean;
  apiKey?: string;
  selectedModel?: string;
};

export type DynamicProviders = Record<string, ProviderConfig>;

// Legacy type for backwards compatibility
export type Provider = BuiltInProviderId;

// Default enabled providers
export const DEFAULT_ENABLED_PROVIDERS: BuiltInProviderId[] = ['openai', 'google', 'anthropic'];
