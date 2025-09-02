"use client";

import { useState } from 'react';
import type { Provider } from './ProviderSettings';
import { getProviderColor } from '~/types/modelConfig';

export interface SelectedModel {
  id: string;
  name: string;
  provider: Provider;
  model: string;
}

interface ModelSelectionProps {
  providerKeys: Record<Provider, string>;
  availableModels: Record<Provider, string[]>;
  selectedModels: SelectedModel[];
  onSelectedModelsChange: (models: SelectedModel[]) => void;
  providerStatus: Record<Provider, 'valid' | 'invalid' | 'unchecked'>;
}

export function ModelSelection({
  providerKeys,
  availableModels,
  selectedModels,
  onSelectedModelsChange,
  providerStatus,
}: ModelSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const configuredProviders = (Object.keys(providerKeys) as Provider[]).filter(
    provider => providerKeys[provider].trim().length > 0 && providerStatus[provider] === 'valid'
  );

  const addModel = (provider: Provider, model: string) => {
    const newModel: SelectedModel = {
      id: `${provider}-${model}-${Date.now()}`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} ${model}`,
      provider,
      model,
    };
    
    onSelectedModelsChange([...selectedModels, newModel]);
  };

  const removeModel = (modelId: string) => {
    if (selectedModels.length <= 2) return; // Minimum 2 models required
    onSelectedModelsChange(selectedModels.filter(m => m.id !== modelId));
  };

  const canRemoveModel = selectedModels.length > 2;
  const canAddModel = selectedModels.length < 8;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <span>🎯</span>
        <span>Select Models ({selectedModels.length}/8)</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[500px] bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-4 max-h-[600px] overflow-y-auto">
          <h3 className="text-lg font-bold mb-3 text-white">Model Selection</h3>
          <p className="text-sm text-gray-400 mb-4">
            Choose 2-8 AI models for comparison. You can select multiple models from the same provider.
          </p>

          {/* Currently Selected Models */}
          {selectedModels.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-3">Selected Models</h4>
              <div className="space-y-2">
                {selectedModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getProviderColor(model.provider) }}
                      />
                      <span className="text-white font-medium">{model.name}</span>
                      <span className="text-xs text-gray-400">{model.model}</span>
                    </div>
                    <button
                      onClick={() => removeModel(model.id)}
                      disabled={!canRemoveModel}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        canRemoveModel
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title={!canRemoveModel ? "Need at least 2 models" : "Remove model"}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Models by Provider */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-white">Available Models</h4>
            
            {configuredProviders.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p>No providers configured yet.</p>
                <p className="text-sm">Configure provider API keys first to see available models.</p>
              </div>
            ) : (
              configuredProviders.map((provider) => {
                const models = availableModels[provider] ?? [];
                
                return (
                  <div key={provider} className="border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getProviderColor(provider) }}
                      />
                      <h5 className="font-medium text-white">
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </h5>
                      <span className="text-xs text-gray-400">({models.length} models)</span>
                    </div>
                    
                    {models.length === 0 ? (
                      <p className="text-gray-400 text-sm">No models available</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {models.map((model) => {
                          const isAlreadySelected = selectedModels.some(
                            m => m.provider === provider && m.model === model
                          );
                          
                          return (
                            <button
                              key={model}
                              onClick={() => addModel(provider, model)}
                              disabled={isAlreadySelected || !canAddModel}
                              className={`text-left p-2 rounded text-sm transition-colors ${
                                isAlreadySelected
                                  ? 'bg-green-900/30 text-green-400 cursor-not-allowed'
                                  : !canAddModel
                                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-700 hover:bg-gray-600 text-white'
                              }`}
                              title={
                                isAlreadySelected 
                                  ? "Already selected"
                                  : !canAddModel
                                  ? "Maximum 8 models reached"
                                  : "Add this model"
                              }
                            >
                              <div className="flex justify-between items-center">
                                <span>{model}</span>
                                <span className="text-xs">
                                  {isAlreadySelected ? '✓' : '+'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-600">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                Selected: {selectedModels.length}/8 models
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
