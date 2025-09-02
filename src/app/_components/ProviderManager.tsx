"use client";

import { useState } from 'react';
import type { Provider } from './ProviderSettings';

interface ProviderManagerProps {
  enabledProviders: Provider[];
  onProvidersChange: (providers: Provider[]) => void;
}

const ALL_PROVIDERS: { key: Provider; name: string; description: string; color: string }[] = [
  {
    key: 'openai',
    name: 'OpenAI',
    description: 'GPT models including GPT-4, GPT-3.5-turbo',
    color: 'hsl(140, 70%, 60%)', // Green
  },
  {
    key: 'google',
    name: 'Google',
    description: 'Gemini models including 2.5, 2.0, and 1.5 series',
    color: 'hsl(220, 90%, 60%)', // Blue
  },
  {
    key: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models including Opus, Sonnet, and Haiku',
    color: 'hsl(30, 80%, 60%)', // Orange
  },
  {
    key: 'grok',
    name: 'Grok (X.AI)',
    description: 'Grok models including beta and public versions',
    color: 'hsl(280, 70%, 60%)', // Purple
  },
];

export function ProviderManager({ enabledProviders, onProvidersChange }: ProviderManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleProvider = (provider: Provider) => {
    if (enabledProviders.includes(provider)) {
      // Remove provider (but ensure at least one remains)
      if (enabledProviders.length > 1) {
        onProvidersChange(enabledProviders.filter(p => p !== provider));
      }
    } else {
      // Add provider
      onProvidersChange([...enabledProviders, provider]);
    }
  };

  const isProviderEnabled = (provider: Provider) => enabledProviders.includes(provider);
  const canRemoveProvider = (provider: Provider) => !(isProviderEnabled(provider) && enabledProviders.length === 1);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <span>🔧</span>
        <span>Manage Providers ({enabledProviders.length})</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-4">
          <h3 className="text-lg font-bold mb-3 text-white">AI Providers</h3>
          <p className="text-sm text-gray-400 mb-4">
            Select which AI providers to include in your ensemble. At least one provider must be enabled.
          </p>

          <div className="space-y-3">
            {ALL_PROVIDERS.map((provider) => {
              const enabled = isProviderEnabled(provider.key);
              const canRemove = canRemoveProvider(provider.key);

              return (
                <div
                  key={provider.key}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    enabled
                      ? 'bg-gray-700 border-gray-500'
                      : 'bg-gray-900 border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: provider.color }}
                    />
                    <div>
                      <div className="font-medium text-white">
                        {provider.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {provider.description}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleProvider(provider.key)}
                    disabled={!canRemove && enabled}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      enabled
                        ? canRemove
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title={
                      enabled && !canRemove
                        ? 'Cannot remove the last provider'
                        : enabled
                        ? 'Remove provider'
                        : 'Add provider'
                    }
                  >
                    {enabled ? 'Remove' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-600">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                Active Providers: {enabledProviders.length}
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
