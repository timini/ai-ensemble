"use client";

import { useState } from 'react';
import type { Provider } from '@/types/api';
import type { SelectedModel } from './ModelSelection';
import { getProviderColor } from '@/types/modelConfig';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModel: (model: SelectedModel) => void;
  availableModels: Record<Provider, string[]>;
  providerStatus: Record<Provider, 'valid' | 'invalid' | 'unchecked' | 'validating'>;
}

export function AddModelModal({ 
  isOpen, 
  onClose, 
  onAddModel, 
  availableModels, 
  providerStatus
}: AddModelModalProps) {
  const [activeTab, setActiveTab] = useState<'validated' | 'manual'>('validated');
  const [manualProvider, setManualProvider] = useState<Provider>('openai');
  const [manualModelName, setManualModelName] = useState('');
  const [manualResponse, setManualResponse] = useState('');

  const configuredProviders = (Object.keys(availableModels) as Provider[]).filter(
    provider => availableModels[provider]?.length > 0 && providerStatus[provider] === 'valid'
  );

  const handleAddValidatedModel = (provider: Provider, model: string) => {
    const newModel: SelectedModel = {
      id: `${provider}-${model}-${Date.now()}`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} - ${model}`,
      provider,
      model,
    };
    
    onAddModel(newModel);
    onClose();
  };

  const handleAddManualModel = () => {
    if (!manualModelName.trim() || !manualResponse.trim()) {
      alert('Please enter both model name and response.');
      return;
    }

    const newModel: SelectedModel = {
      id: `manual-${Date.now()}`,
      name: `${manualProvider.charAt(0).toUpperCase() + manualProvider.slice(1)} - ${manualModelName.trim()}`,
      provider: manualProvider,
      model: manualModelName.trim(),
      isManual: true,
      manualResponse: manualResponse.trim(),
    };
    
    onAddModel(newModel);
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setManualProvider('openai');
    setManualModelName('');
    setManualResponse('');
    onClose();
  };

  if (!isOpen) return null;

  const canAddModel = true; // We'll let the parent component handle the limit check

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add Model</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('validated')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'validated'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Validated Models
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manual Response
          </button>
        </div>

        {activeTab === 'validated' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Select from validated models that have been tested with your API keys.
            </p>
            
            {configuredProviders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No validated models available.</p>
                <p className="text-sm">Configure provider API keys first to see available models.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {configuredProviders.map((provider) => {
                  const models = availableModels[provider] ?? [];
                  
                  return (
                    <div key={provider} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getProviderColor(provider) }}
                        />
                        <h3 className="font-medium text-white capitalize">
                          {provider} ({models.length} models)
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {models.map((model) => {
                          return (
                            <button
                              key={model}
                              onClick={() => handleAddValidatedModel(provider, model)}
                              className="text-left p-3 rounded text-sm transition-colors bg-gray-600 hover:bg-gray-500 text-white"
                              title="Add this model"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{model}</span>
                                <span className="text-xs">+</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Add a manual response that will be included in the comparison and agreement analysis.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddManualModel(); }} className="space-y-4">
              <div>
                <label htmlFor="manualProvider" className="block text-sm font-medium text-gray-300 mb-2">
                  Provider
                </label>
                <select
                  id="manualProvider"
                  value={manualProvider}
                  onChange={(e) => setManualProvider(e.target.value as Provider)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="openai">OpenAI</option>
                  <option value="google">Google</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="grok">Grok</option>
                </select>
              </div>

              <div>
                <label htmlFor="manualModelName" className="block text-sm font-medium text-gray-300 mb-2">
                  Model Name
                </label>
                <input
                  id="manualModelName"
                  type="text"
                  value={manualModelName}
                  onChange={(e) => setManualModelName(e.target.value)}
                  placeholder="e.g., GPT-4, Claude-3.5-Sonnet, Gemini Pro"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="manualResponse" className="block text-sm font-medium text-gray-300 mb-2">
                  Response
                </label>
                <textarea
                  id="manualResponse"
                  value={manualResponse}
                  onChange={(e) => setManualResponse(e.target.value)}
                  placeholder="Paste the AI model's response here..."
                  rows={8}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none resize-vertical"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[hsl(280,100%,70%)] text-white font-bold rounded-lg hover:bg-[hsl(280,100%,60%)] disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={!canAddModel}
                >
                  Add Manual Response
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

