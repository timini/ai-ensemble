"use client";

import { ApiConfiguration } from './ApiConfiguration';
import { PromptInput } from './PromptInput';
import { SummarizerSelection } from './SummarizerSelection';
import { type Provider, type KeyStatus } from './ProviderSettings';

interface QueryFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  keys: Record<Provider, string>;
  handleKeyChange: (provider: Provider, value: string) => void;
  models: Record<Provider, string>;
  handleModelChange: (provider: Provider, value: string) => void;
  keyStatus: Record<Provider, KeyStatus>;
  handleValidateKey: (provider: Provider) => void;
  summarizerSelection: string;
  setSummarizerSelection: (selection: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleStreamingSubmit: (e: React.FormEvent) => Promise<void>;
  ensembleQueryIsPending: boolean;
  validProviders: Provider[];
  modelLists: Record<Provider, string[]>;
  initialLoad: boolean;
  validationInProgress: Set<Provider>;
  modelsLoading: Set<Provider>;
  isKeyVisible: Set<Provider>;
  toggleKeyVisibility: (provider: Provider) => void;
  isStreaming: boolean;
}

export function QueryForm({ prompt, setPrompt, keys, handleKeyChange, models, handleModelChange, keyStatus, handleValidateKey, summarizerSelection, setSummarizerSelection, handleSubmit: _handleSubmit, handleStreamingSubmit, ensembleQueryIsPending: _ensembleQueryIsPending, validProviders, modelLists, initialLoad, validationInProgress, modelsLoading, isKeyVisible, toggleKeyVisibility, isStreaming }: QueryFormProps) {
  // Calculate providers with actual API keys (not just validated)
  const providersWithKeys = (Object.keys(keys) as Provider[]).filter(p => keys[p].trim().length > 0);
  const missingProviders = (Object.keys(keys) as Provider[]).filter(p => keys[p].trim().length === 0);
  
  // Create validation message
  const getValidationMessage = () => {
    if (providersWithKeys.length === 0) {
      return "Add at least one API key to start streaming responses";
    }
    if (!prompt.trim()) {
      return "Enter a prompt to continue";
    }
    if (!summarizerSelection) {
      return "Select a summarizer model to continue";
    }
    
    // Show which providers are missing (as info, not blocking)
    if (missingProviders.length > 0 && providersWithKeys.length > 0) {
      const missingNames = missingProviders.map(p => p.charAt(0).toUpperCase() + p.slice(1));
      return `Note: ${missingNames.join(', ')} ${missingProviders.length === 1 ? 'is' : 'are'} not configured`;
    }
    
    return null;
  };

  const validationMessage = getValidationMessage();
  const canSubmit = !isStreaming && !!prompt.trim() && providersWithKeys.length > 0 && !!summarizerSelection;

  return (
    <>
      <ApiConfiguration
        keys={keys}
        handleKeyChange={handleKeyChange}
        models={models}
        handleModelChange={handleModelChange}
        keyStatus={keyStatus}
        handleValidateKey={handleValidateKey}
        modelLists={modelLists}
        initialLoad={initialLoad}
        validationInProgress={validationInProgress}
        modelsLoading={modelsLoading}
        isKeyVisible={isKeyVisible}
        toggleKeyVisibility={toggleKeyVisibility}
      />

      <form onSubmit={handleStreamingSubmit} className="flex flex-col gap-4">
        <PromptInput prompt={prompt} setPrompt={setPrompt} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <SummarizerSelection
            summarizerSelection={summarizerSelection}
            setSummarizerSelection={setSummarizerSelection}
            validProviders={validProviders}
            modelLists={modelLists}
          />
          <div className="flex flex-col items-end gap-2">
            {validationMessage && (
              <div className={`text-sm text-right ${
                canSubmit && missingProviders.length > 0 
                  ? 'text-blue-400' // Info message for missing providers when form is valid
                  : 'text-amber-400' // Warning/error message when form is invalid
              }`}>
                {validationMessage}
              </div>
            )}
            <button 
              type="submit" 
              disabled={!canSubmit} 
              className="bg-[hsl(280,100%,70%)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[hsl(280,100%,60%)] disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isStreaming ? "Streaming..." : providersWithKeys.length > 0 ? `Stream with ${providersWithKeys.length} provider${providersWithKeys.length > 1 ? 's' : ''}` : "Stream Response"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
