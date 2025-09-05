"use client";

import { useState } from 'react';
import { getProviderColor } from '@/types/modelConfig';
import type { SelectedModel } from './ModelSelection';
import type { Provider } from '@/types/api';
import { AddModelModal } from './AddModelModal';

interface StreamingData {
  modelStates: Record<string, 'pending' | 'streaming' | 'complete' | 'error'>;
}

interface SelectedModelsDisplayProps {
  selectedModels: SelectedModel[];
  validationResults?: Record<string, 'valid' | 'invalid' | 'pending'>;
  availableModels: Record<Provider, string[]>;
  providerStatus: Record<Provider, 'valid' | 'invalid' | 'unchecked' | 'validating'>;
  onAddModel: (model: SelectedModel) => void;
  onRemoveModel: (modelId: string) => void;
  isStreaming: boolean;
  streamingData: StreamingData;
}

export function SelectedModelsDisplay({ 
  selectedModels, 
  validationResults, 
  availableModels, 
  providerStatus, 
  onAddModel, 
  onRemoveModel,
  isStreaming,
  streamingData,
}: SelectedModelsDisplayProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'pending': return '⏳';
      case 'streaming': return '🔄';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  if (selectedModels.length === 0) {
    return (
      <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-2">🎯</div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Models Selected</h3>
        <p className="text-gray-400">
          Configure providers and select 2-8 AI models to start comparing responses.
        </p>
      </div>
    );
  }

  const getValidationIcon = (status: 'valid' | 'invalid' | 'pending' | 'unchecked') => {
    switch (status) {
      case 'valid': return '✅';
      case 'invalid': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getValidationColor = (modelId: string) => {
    if (!validationResults) return 'text-gray-400';
    const status = validationResults[modelId];
    switch (status) {
      case 'valid': return 'text-green-400';
      case 'invalid': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Selected Models ({selectedModels.length})</h3>
        <div className="text-sm text-gray-400">
          {selectedModels.length >= 2 ? `Ready for comparison` : `Need ${2 - selectedModels.length} more`}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {selectedModels.map((model, index) => (
          <div
            key={model.id}
            className="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors relative group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getProviderColor(model.provider) }}
                />
                <span className="text-xs font-medium text-gray-400">
                  #{index + 1}
                </span>
                {model.isManual && (
                  <span
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                    title="Response provided manually. No API call."
                  >
                    Manual
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-sm ${getValidationColor(model.id)}`}>
                  <div>{isStreaming
                    ? getStateIcon(streamingData.modelStates[model.id] ?? 'pending')
                    : getValidationIcon(validationResults ? (validationResults[model.id] ?? 'pending') : 'pending')}
                  </div>
                </div>
                {selectedModels.length > 2 && (
                  <button
                    onClick={() => onRemoveModel(model.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-sm transition-opacity"
                    title="Remove model"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-white text-sm leading-tight">
                {model.name}
              </div>
              <div className="text-xs text-gray-400 leading-tight">
                {model.model}
              </div>
              <div className="text-xs text-gray-500">
                {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}
              </div>
              {model.isManual && model.manualResponse && (
                <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-700 rounded">
                  <div className="truncate" title={model.manualResponse}>
                    &ldquo;{model.manualResponse.substring(0, 50)}...&rdquo;
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Placeholder for additional models */}
        {selectedModels.length < 8 && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center hover:border-gray-500 transition-colors w-full text-left"
          >
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-1">+</div>
              <div className="text-xs">Add Model</div>
              <div className="text-xs">({8 - selectedModels.length} slots left)</div>
            </div>
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-400">{selectedModels.length}</div>
            <div className="text-xs text-gray-400">Models</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">
              {new Set(selectedModels.map(m => m.provider)).size}
            </div>
            <div className="text-xs text-gray-400">Providers</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400">
              {selectedModels.length >= 2 ? Math.floor((selectedModels.length * (selectedModels.length - 1)) / 2) : 0}
            </div>
            <div className="text-xs text-gray-400">Comparisons</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-400">
              {selectedModels.length >= 2 ? 'Ready' : 'Waiting'}
            </div>
            <div className="text-xs text-gray-400">Status</div>
          </div>
        </div>
      </div>

      {/* Add Model Modal */}
      <AddModelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddModel={onAddModel}
        availableModels={availableModels}
        providerStatus={providerStatus}
      />
    </div>
  );
}
