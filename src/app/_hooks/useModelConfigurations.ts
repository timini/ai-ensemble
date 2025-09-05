import { useState, useEffect, useCallback } from 'react';
import type { ModelConfiguration } from '@/types/modelConfig';
import { createDefaultConfigurations } from '@/types/modelConfig';
import { api } from '@/trpc/react';
import type { Provider } from '@/types/api';
import { FALLBACK_MODELS } from '@/utils/constants';

const STORAGE_KEY = 'ai-ensemble-model-configurations';

export function useModelConfigurations() {
  const [configurations, setConfigurations] = useState<ModelConfiguration[]>(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved) as ModelConfiguration[];
        } catch {
          // Fall back to defaults if parsing fails
        }
      }
    }
    return createDefaultConfigurations();
  });

  const [availableModels, setAvailableModels] = useState<Record<Provider, string[]>>(FALLBACK_MODELS);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, 'valid' | 'invalid' | 'pending'>>({});

  // Save to localStorage whenever configurations change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configurations));
    }
  }, [configurations]);

  // Get enabled configurations
  const enabledConfigurations = configurations.filter(config => config.enabled && config.apiKey.trim());

  // Group configurations by provider for API calls
  const getProviderKeys = useCallback((): Record<Provider, string> => {
    const keys: Record<Provider, string> = { openai: '', google: '', anthropic: '', grok: '' };
    
    // Use the first API key found for each provider
    for (const config of enabledConfigurations) {
      if (config.apiKey.trim() && !keys[config.provider]) {
        keys[config.provider] = config.apiKey.trim();
      }
    }
    
    return keys;
  }, [enabledConfigurations]);

  // Validation mutations
  const validateAllKeysMutation = api.validation.validateAllKeys.useMutation({
    onSuccess: (data) => {
      setAvailableModels(data.modelLists);
      
      // Update validation results for each configuration
      const newResults: Record<string, 'valid' | 'invalid' | 'pending'> = {};
      configurations.forEach(config => {
        if (config.apiKey.trim()) {
          const providerStatus = data.statuses[config.provider];
          newResults[config.id] = providerStatus === 'valid' ? 'valid' : 'invalid';
        } else {
          newResults[config.id] = 'pending';
        }
      });
      setValidationResults(newResults);
      setIsValidating(false);
    },
    onError: () => {
      setIsValidating(false);
    }
  });

  // Validate all configurations
  const validateConfigurations = useCallback(() => {
    const keys = getProviderKeys();
    const hasAnyKey = Object.values(keys).some(key => key.trim());
    
    if (!hasAnyKey) return;
    
    setIsValidating(true);
    validateAllKeysMutation.mutate(keys);
  }, [getProviderKeys, validateAllKeysMutation]);

  // Auto-validate when configurations change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateConfigurations();
    }, 1000); // Debounce validation calls

    return () => clearTimeout(timeoutId);
  }, [configurations, validateConfigurations]);

  // Update a specific configuration
  const updateConfiguration = useCallback((configId: string, updates: Partial<ModelConfiguration>) => {
    setConfigurations(prev => 
      prev.map(config => 
        config.id === configId ? { ...config, ...updates } : config
      )
    );
  }, []);

  // Add a new configuration
  const addConfiguration = useCallback((newConfig: ModelConfiguration) => {
    setConfigurations(prev => [...prev, newConfig]);
  }, []);

  // Remove a configuration
  const removeConfiguration = useCallback((configId: string) => {
    setConfigurations(prev => prev.filter(config => config.id !== configId));
  }, []);

  // Get configurations grouped by provider
  const getConfigurationsByProvider = useCallback(() => {
    const grouped: Record<Provider, ModelConfiguration[]> = {
      openai: [],
      google: [],
      anthropic: [],
      grok: []
    };

    enabledConfigurations.forEach(config => {
      grouped[config.provider].push(config);
    });

    return grouped;
  }, [enabledConfigurations]);

  // Check if ready for streaming (has at least 2 enabled configs with keys)
  const isReadyForStreaming = enabledConfigurations.length >= 2;

  // Get streaming payload
  const getStreamingPayload = useCallback((prompt: string, summarizer: { configId: string }) => {
    const summarizerConfig = configurations.find(c => c.id === summarizer.configId);
    if (!summarizerConfig) {
      throw new Error('Summarizer configuration not found');
    }

    // Create payload with dynamic model configurations
    const keys: Record<string, string> = {};
    const models: Record<string, string> = {};

    enabledConfigurations.forEach(config => {
      keys[config.id] = config.apiKey;
      models[config.id] = config.model;
    });

    return {
      prompt,
      configurations: enabledConfigurations.map(config => ({
        id: config.id,
        name: config.name,
        provider: config.provider,
        model: config.model,
      })),
      keys,
      models,
      summarizer: {
        configId: summarizerConfig.id,
        provider: summarizerConfig.provider,
        model: summarizerConfig.model,
      },
    };
  }, [configurations, enabledConfigurations]);

  return {
    configurations,
    enabledConfigurations,
    availableModels,
    isValidating,
    validationResults,
    isReadyForStreaming,
    updateConfiguration,
    addConfiguration,
    removeConfiguration,
    setConfigurations,
    validateConfigurations,
    getConfigurationsByProvider,
    getStreamingPayload,
    getProviderKeys,
  };
}
