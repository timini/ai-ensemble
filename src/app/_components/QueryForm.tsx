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
  ensembleQueryIsPending: boolean;
  validProviders: Provider[];
  modelLists: Record<Provider, string[]>;
  initialLoad: boolean;
  validationInProgress: Set<Provider>;
  modelsLoading: Set<Provider>;
  isKeyVisible: Set<Provider>;
  toggleKeyVisibility: (provider: Provider) => void;
}

export function QueryForm({ prompt, setPrompt, keys, handleKeyChange, models, handleModelChange, keyStatus, handleValidateKey, summarizerSelection, setSummarizerSelection, handleSubmit, ensembleQueryIsPending, validProviders, modelLists, initialLoad, validationInProgress, modelsLoading, isKeyVisible, toggleKeyVisibility }: QueryFormProps) {
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PromptInput prompt={prompt} setPrompt={setPrompt} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SummarizerSelection
            summarizerSelection={summarizerSelection}
            setSummarizerSelection={setSummarizerSelection}
            validProviders={validProviders}
            modelLists={modelLists}
          />
          <button type="submit" disabled={ensembleQueryIsPending || !prompt || validProviders.length === 0} className="bg-[hsl(280,100%,70%)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[hsl(280,100%,60%)] disabled:bg-gray-600 disabled:cursor-not-allowed">{ensembleQueryIsPending ? "Processing..." : "Submit"}</button>
        </div>
      </form>
    </>
  );
}
