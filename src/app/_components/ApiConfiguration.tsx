"use client";

import { ProviderSettings } from './ProviderSettings';
import type { Provider, KeyStatus } from '@/types/api';

interface ApiConfigurationProps {
  keys: Record<Provider, string>;
  handleKeyChange: (provider: Provider, value: string) => void;
  models: Record<Provider, string>;
  handleModelChange: (provider: Provider, value: string) => void;
  keyStatus: Record<Provider, KeyStatus>;
  handleValidateKey: (provider: Provider) => void;
  modelLists: Record<Provider, string[]>;
  initialLoad: boolean;
  validationInProgress: Set<Provider>;
  modelsLoading: Set<Provider>;
  isKeyVisible: Set<Provider>;
  toggleKeyVisibility: (provider: Provider) => void;
}

export function ApiConfiguration({ keys, handleKeyChange, models, handleModelChange, keyStatus, handleValidateKey, modelLists, initialLoad, validationInProgress, modelsLoading, isKeyVisible, toggleKeyVisibility }: ApiConfigurationProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-8">
      <h2 className="text-2xl font-bold mb-4">API Configuration</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="provider-settings-container">
        {(Object.keys(keys) as Provider[]).map(p => (
          <ProviderSettings key={p} provider={p} title={p.charAt(0).toUpperCase() + p.slice(1)} models={modelLists[p] ?? []} onKeyChange={handleKeyChange} onModelChange={handleModelChange} onValidate={handleValidateKey} isValidationInProgress={initialLoad || validationInProgress.has(p)} isModelsLoading={modelsLoading.has(p)} keyStatus={keyStatus[p]} currentKey={keys[p]} currentModel={models[p]} isKeyVisible={isKeyVisible.has(p)} toggleKeyVisibility={() => toggleKeyVisibility(p)} />
        ))}
      </div>
    </div>
  );
}
