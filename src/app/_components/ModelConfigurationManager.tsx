"use client";

import { useState } from 'react';
import type { ModelConfiguration, ModelConfigurationTemplate } from '~/types/modelConfig';
import { MODEL_TEMPLATES, getTemplatesByProvider, getProviderColor } from '~/types/modelConfig';
import type { Provider } from './ProviderSettings';

interface ModelConfigurationManagerProps {
  configurations: ModelConfiguration[];
  onConfigurationsChange: (configurations: ModelConfiguration[]) => void;
  availableModels: Record<Provider, string[]>;
}

export function ModelConfigurationManager({ 
  configurations, 
  onConfigurationsChange,
  availableModels 
}: ModelConfigurationManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider>('openai');

  const enabledConfigurations = configurations.filter(config => config.enabled);
  const maxConfigurations = 8;
  const minConfigurations = 2;

  const toggleConfiguration = (configId: string) => {
    const updatedConfigs = configurations.map(config => {
      if (config.id === configId) {
        // Don't allow disabling if it would leave us with fewer than minimum
        if (config.enabled && enabledConfigurations.length <= minConfigurations) {
          return config;
        }
        return { ...config, enabled: !config.enabled };
      }
      return config;
    });
    onConfigurationsChange(updatedConfigs);
  };

  const removeConfiguration = (configId: string) => {
    if (enabledConfigurations.length <= minConfigurations) return;
    
    const updatedConfigs = configurations.filter(config => config.id !== configId);
    onConfigurationsChange(updatedConfigs);
  };

  const addConfiguration = (template: ModelConfigurationTemplate) => {
    if (configurations.length >= maxConfigurations) return;

    // Generate unique ID if template ID already exists
    let newId = template.id;
    let counter = 1;
    while (configurations.some(config => config.id === newId)) {
      newId = `${template.id}-${counter}`;
      counter++;
    }

    const newConfig: ModelConfiguration = {
      id: newId,
      name: template.name + (counter > 1 ? ` (${counter})` : ''),
      provider: template.provider,
      model: template.model,
      apiKey: "",
      enabled: true,
    };

    onConfigurationsChange([...configurations, newConfig]);
    setShowAddModal(false);
  };

  const updateConfiguration = (configId: string, updates: Partial<ModelConfiguration>) => {
    const updatedConfigs = configurations.map(config =>
      config.id === configId ? { ...config, ...updates } : config
    );
    onConfigurationsChange(updatedConfigs);
  };

  const canRemove = (config: ModelConfiguration) => {
    return !(config.enabled && enabledConfigurations.length <= minConfigurations);
  };

  const canDisable = (config: ModelConfiguration) => {
    return !(config.enabled && enabledConfigurations.length <= minConfigurations);
  };

  const getAvailableModelsForProvider = (provider: Provider) => {
    return availableModels[provider] ?? [];
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <span>⚙️</span>
        <span>Model Configurations ({enabledConfigurations.length})</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[600px] bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-4 max-h-[600px] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Model Configurations</h3>
              <p className="text-sm text-gray-400">
                Configure {minConfigurations}-{maxConfigurations} AI models for comparison. You can use multiple models from the same provider.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={configurations.length >= maxConfigurations}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Model
            </button>
          </div>

          <div className="space-y-3">
            {configurations.map((config) => (
              <div
                key={config.id}
                className={`p-4 rounded-lg border transition-colors ${
                  config.enabled
                    ? 'bg-gray-700 border-gray-500'
                    : 'bg-gray-900 border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getProviderColor(config.provider) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">
                        {config.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {config.provider.charAt(0).toUpperCase() + config.provider.slice(1)} • {config.model}
                      </div>
                      
                      {/* API Key Input */}
                      <div className="mt-2">
                        <input
                          type="password"
                          placeholder={`${config.provider.charAt(0).toUpperCase() + config.provider.slice(1)} API Key`}
                          value={config.apiKey}
                          onChange={(e) => updateConfiguration(config.id, { apiKey: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Model Selection */}
                      <div className="mt-2">
                        <select
                          value={config.model}
                          onChange={(e) => updateConfiguration(config.id, { model: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        >
                          {getAvailableModelsForProvider(config.provider).map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleConfiguration(config.id)}
                      disabled={!canDisable(config)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        config.enabled
                          ? canDisable(config)
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={
                        config.enabled && !canDisable(config)
                          ? `Cannot disable - need at least ${minConfigurations} models`
                          : config.enabled
                          ? 'Disable model'
                          : 'Enable model'
                      }
                    >
                      {config.enabled ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => removeConfiguration(config.id)}
                      disabled={!canRemove(config)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        canRemove(config)
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title={
                        !canRemove(config)
                          ? `Cannot remove - need at least ${minConfigurations} models`
                          : 'Remove model'
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-600">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                Active Models: {enabledConfigurations.length} / {maxConfigurations}
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

      {/* Add Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-gray-800 rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Add Model Configuration</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {/* Provider Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['openai', 'google', 'anthropic', 'grok'] as Provider[]).map(provider => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedProvider === provider
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getProviderColor(provider) }}
                      />
                      <span className="text-white font-medium">
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Templates */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Available Models
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {getTemplatesByProvider(selectedProvider).map(template => (
                  <button
                    key={template.id}
                    onClick={() => addConfiguration(template)}
                    className="w-full text-left p-3 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-white">
                          {template.name}
                          {template.recommended && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {template.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Model: {template.model}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
