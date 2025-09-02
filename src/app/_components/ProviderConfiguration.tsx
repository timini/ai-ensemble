"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Provider } from './ProviderSettings';
import { getProviderColor } from '~/types/modelConfig';
import { api } from '~/trpc/react';

interface ProviderConfigurationProps {
  providerKeys: Record<Provider, string>;
  onProviderKeysChange: (keys: Record<Provider, string>) => void;
  providerStatus: Record<Provider, 'valid' | 'invalid' | 'unchecked'>;
  onProviderStatusChange: (status: Record<Provider, 'valid' | 'invalid' | 'unchecked'>) => void;
  availableModels: Record<Provider, string[]>;
  onAvailableModelsChange: (models: Record<Provider, string[]>) => void;
}

const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI',
    description: 'GPT models including GPT-4, GPT-3.5-turbo',
    keyPlaceholder: 'sk-...',
  },
  google: {
    name: 'Google',
    description: 'Gemini models including 2.5, 2.0, and 1.5 series',
    keyPlaceholder: 'Your Google AI API key',
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models including Opus, Sonnet, and Haiku',
    keyPlaceholder: 'Your Anthropic API key',
  },
  grok: {
    name: 'Grok (X.AI)',
    description: 'Grok models including beta and latest versions',
    keyPlaceholder: 'Your X.AI API key',
  },
} as const;

export function ProviderConfiguration({ 
  providerKeys, 
  onProviderKeysChange, 
  providerStatus,
  onProviderStatusChange,
  availableModels,
  onAvailableModelsChange
}: ProviderConfigurationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<Provider>>(new Set());
  const [validatingKeys, setValidatingKeys] = useState<Set<Provider>>(new Set());

  // tRPC mutations for validation
  const validateApiKeyMutation = api.validation.validateApiKey.useMutation();
  const getModelsMutation = api.validation.getModels.useMutation();

  // Load API keys from localStorage on mount and validate them
  useEffect(() => {
    const savedKeys: Partial<Record<Provider, string>> = {};
    
    (['openai', 'google', 'anthropic', 'grok'] as Provider[]).forEach(provider => {
      const savedKey = localStorage.getItem(`ai-ensemble-${provider}-key`);
      if (savedKey) {
        savedKeys[provider] = savedKey;
      }
    });

    if (Object.keys(savedKeys).length > 0) {
      onProviderKeysChange({
        ...providerKeys,
        ...savedKeys,
      });

      // Validate all saved keys on page load in parallel
      Object.entries(savedKeys).forEach(([provider, key]) => {
        if (key?.trim()) {
          // Set immediate feedback that validation is starting
          setTimeout(() => {
            setValidatingKeys(prev => new Set([...prev, provider as Provider]));
          }, 50);
          
          // Start validation with delay to let state update
          setTimeout(() => {
            validateProviderKey(provider as Provider, key).catch(console.error);
          }, 100);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save API keys to localStorage whenever they change
  useEffect(() => {
    (['openai', 'google', 'anthropic', 'grok'] as Provider[]).forEach(provider => {
      const key = providerKeys[provider];
      if (key && key.trim().length > 0) {
        localStorage.setItem(`ai-ensemble-${provider}-key`, key);
      } else {
        localStorage.removeItem(`ai-ensemble-${provider}-key`);
      }
    });
  }, [providerKeys]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleKeyVisibility = (provider: Provider) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  };

  const validateProviderKey = useCallback(async (provider: Provider, key: string) => {
    if (!key.trim()) {
      onProviderStatusChange({ [provider]: 'unchecked' });
      onAvailableModelsChange({ [provider]: [] });
      return;
    }

    setValidatingKeys(prev => new Set([...prev, provider]));
    
    try {
      // Validate the API key
      const validationResult = await validateApiKeyMutation.mutateAsync({
        provider,
        key,
      });

      if (validationResult.success) {
        // Update status to valid
        onProviderStatusChange({ [provider]: 'valid' });

        // Fetch available models
        try {
          const modelsResult = await getModelsMutation.mutateAsync({
            provider,
            key,
          });
          
          onAvailableModelsChange({ [provider]: modelsResult });
        } catch (modelsError) {
          console.error(`Error fetching models for ${provider}:`, modelsError);
          onAvailableModelsChange({ [provider]: [] });
        }
      } else {
        onProviderStatusChange({ [provider]: 'invalid' });
        onAvailableModelsChange({ [provider]: [] });
      }
    } catch (error) {
      console.error(`Error validating ${provider} API key:`, error);
      
      onProviderStatusChange({ [provider]: 'invalid' });
      onAvailableModelsChange({ [provider]: [] });
    } finally {
      setValidatingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(provider);
        return newSet;
      });
    }
  }, [validateApiKeyMutation, getModelsMutation, providerStatus, onProviderStatusChange, availableModels, onAvailableModelsChange]);

  // Debounced validation refs
  const validationTimeouts = useRef<Record<Provider, NodeJS.Timeout | null>>({
    openai: null,
    google: null,
    anthropic: null,
    grok: null,
  });

  const updateProviderKey = useCallback((provider: Provider, key: string) => {
    onProviderKeysChange({
      ...providerKeys,
      [provider]: key,
    });

    // Clear existing timeout for this provider
    if (validationTimeouts.current[provider]) {
      clearTimeout(validationTimeouts.current[provider]);
      validationTimeouts.current[provider] = null;
    }

    // Set new timeout for validation
    if (key.trim()) {
      validationTimeouts.current[provider] = setTimeout(() => {
        validateProviderKey(provider, key).catch(console.error);
        validationTimeouts.current[provider] = null;
      }, 1000);
    } else {
      // Immediately reset status if key is empty
      validateProviderKey(provider, key).catch(console.error);
    }
  }, [providerKeys, onProviderKeysChange, validateProviderKey]);

  const getStatusIcon = (provider: Provider) => {
    if (validatingKeys.has(provider)) {
      return '🔄'; // Spinning/validating
    }
    
    const status = providerStatus[provider];
    switch (status) {
      case 'valid': return '✅';
      case 'invalid': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (provider: Provider) => {
    if (validatingKeys.has(provider)) {
      return 'text-blue-400'; // Validating color
    }
    
    const status = providerStatus[provider];
    switch (status) {
      case 'valid': return 'text-green-400';
      case 'invalid': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const configuredProviders = (Object.keys(providerKeys) as Provider[]).filter(
    provider => providerKeys[provider].trim().length > 0
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <span>🔧</span>
        <span>Configure Providers ({configuredProviders.length}/4)</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-4">
          <h3 className="text-lg font-bold mb-3 text-white">AI Provider Configuration</h3>
          <p className="text-sm text-gray-400 mb-4">
            Configure API keys for AI providers. Models will be available once keys are validated.
          </p>

          <div className="space-y-4">
            {(Object.keys(PROVIDER_INFO) as Provider[]).map((provider) => {
              const info = PROVIDER_INFO[provider];
              const hasKey = providerKeys[provider].trim().length > 0;
              const modelCount = availableModels[provider]?.length ?? 0;

              return (
                <div
                  key={provider}
                  className="p-4 rounded-lg border border-gray-600 bg-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getProviderColor(provider) }}
                      />
                      <div>
                        <div className="font-medium text-white">{info.name}</div>
                        <div className="text-xs text-gray-400">{info.description}</div>
                      </div>
                    </div>
                    <div className={`text-sm ${getStatusColor(provider)}`}>
                      {getStatusIcon(provider)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type={visibleKeys.has(provider) ? "text" : "password"}
                        placeholder={info.keyPlaceholder}
                        value={providerKeys[provider]}
                        onChange={(e) => updateProviderKey(provider, e.target.value)}
                        onPaste={(e) => {
                        }}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => toggleKeyVisibility(provider)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white transition-colors"
                        title={visibleKeys.has(provider) ? "Hide key" : "Show key"}
                      >
                        {visibleKeys.has(provider) ? "👁️" : "🙈"}
                      </button>
                    </div>

                    {hasKey && validatingKeys.has(provider) && (
                      <div className="text-xs text-blue-400">
                        🔄 Validating API key...
                      </div>
                    )}

                    {hasKey && !validatingKeys.has(provider) && providerStatus[provider] === 'valid' && (
                      <div className="text-xs text-green-400">
                        ✅ {modelCount} models available
                      </div>
                    )}

                    {hasKey && !validatingKeys.has(provider) && providerStatus[provider] === 'invalid' && (
                      <div className="text-xs text-red-400">
                        ❌ Invalid API key
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-600">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                Configured: {configuredProviders.length}/4 providers
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
