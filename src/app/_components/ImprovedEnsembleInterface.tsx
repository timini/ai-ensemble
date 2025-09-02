"use client";

import { useState, useCallback, useEffect } from 'react';
import { Header } from './Header';
import { PromptInput } from './PromptInput';
import { ProviderConfiguration } from './ProviderConfiguration';
import { ModelSelection, type SelectedModel } from './ModelSelection';
import { SelectedModelsDisplay } from './SelectedModelsDisplay';
import { ConsensusDiagram } from './ConsensusDiagram';
import type { Provider } from './ProviderSettings';
import { getProviderColor } from '~/types/modelConfig';
import type { AgreementScore } from '~/types/agreement';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton';

interface StreamingData {
  modelResponses: Record<string, string>;
  consensusResponse: string;
  agreementScores: AgreementScore[];
  modelStates: Record<string, 'pending' | 'streaming' | 'complete' | 'error'>;
  consensusState: 'pending' | 'streaming' | 'complete' | 'error';
  agreementState: 'pending' | 'calculating' | 'complete' | 'error';
}

export function ImprovedEnsembleInterface() {
  // We'll manage availableModels locally since we need to update it from ProviderConfiguration
  const [availableModels, setAvailableModels] = useState<Record<Provider, string[]>>({
    openai: [],
    google: [],
    anthropic: [],
    grok: []
  });

  const [providerKeys, setProviderKeys] = useState<Record<Provider, string>>({
    openai: "",
    google: "",
    anthropic: "",
    grok: ""
  });

  const [providerStatus, setProviderStatus] = useState<Record<Provider, 'valid' | 'invalid' | 'unchecked'>>({
    openai: 'unchecked',
    google: 'unchecked',
    anthropic: 'unchecked',
    grok: 'unchecked'
  });

  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);
  const [prompt, setPrompt] = useState("");
  const [selectedSummarizer, setSelectedSummarizer] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingData, setStreamingData] = useState<StreamingData>({
    modelResponses: {},
    consensusResponse: '',
    agreementScores: [],
    modelStates: {},
    consensusState: 'pending',
    agreementState: 'pending',
  });

  // --- LocalStorage Persistence ---
  const MODELS_STORAGE_KEY = 'ensemble-selected-models';
  const PROMPT_STORAGE_KEY = 'ensemble-prompt';
  const SUMMARIZER_STORAGE_KEY = 'ensemble-summarizer';

  // Load all persisted state from localStorage on initial mount
  useEffect(() => {
    try {
      // Load Models first
      const savedModelsJSON = localStorage.getItem(MODELS_STORAGE_KEY);
      const savedModels = savedModelsJSON ? JSON.parse(savedModelsJSON) as SelectedModel[] : [];
      
      // Load Prompt
      const savedPrompt = localStorage.getItem(PROMPT_STORAGE_KEY);
      if (savedPrompt) {
        setPrompt(savedPrompt);
      }

      if (savedModels.length > 0) {
        // Set models and summarizer together to avoid race condition
        setSelectedModels(savedModels);
        
        // Load Summarizer, ensuring it's valid within the loaded models
        const savedSummarizerId = localStorage.getItem(SUMMARIZER_STORAGE_KEY);
        
        // Use setTimeout to ensure this runs after the models state has been set
        setTimeout(() => {
          if (savedSummarizerId && savedModels.some(m => m.id === savedSummarizerId)) {
            setSelectedSummarizer(savedSummarizerId);
          } else if (savedModels.length > 0) {
            // Default to the first model if no valid summarizer is saved
            setSelectedSummarizer(savedModels[0]!.id);
          }
        }, 0);
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save selected models to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(selectedModels));
    } catch (error) {
      console.error("Failed to save selected models to localStorage:", error);
    }
  }, [JSON.stringify(selectedModels)]); // Only depend on selectedModels changes

  // Save prompt to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(PROMPT_STORAGE_KEY, prompt);
    } catch (error) {
      console.error("Failed to save prompt to localStorage:", error);
    }
  }, [prompt]);

  // Save summarizer to localStorage whenever it changes
  useEffect(() => {
    if (selectedSummarizer && selectedModels.length > 0 && selectedModels.some(m => m.id === selectedSummarizer)) {
      localStorage.setItem(SUMMARIZER_STORAGE_KEY, selectedSummarizer);
    }
  }, [selectedSummarizer, JSON.stringify(selectedModels)]);

  const handleProviderKeysChange = useCallback((keys: Record<Provider, string>) => {
    setProviderKeys(keys);
  }, []);

  const handleProviderStatusChange = useCallback((newStatus: Partial<Record<Provider, 'valid' | 'invalid' | 'unchecked'>>) => {
    setProviderStatus(prevStatus => ({ ...prevStatus, ...newStatus }));
  }, []);

  const handleAvailableModelsChange = useCallback((newlyFetchedModels: Partial<Record<Provider, string[]>>) => {
    setAvailableModels(prevModels => ({ ...prevModels, ...newlyFetchedModels }));
  }, []);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const handleStreamingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || selectedModels.length < 2 || !selectedSummarizer) {
      return;
    }

    setIsStreaming(true);
    
    // Initialize streaming data
    const initialStates: Record<string, 'pending' | 'streaming' | 'complete' | 'error'> = {};
    const initialResponses: Record<string, string> = {};
    
    selectedModels.forEach(model => {
      initialStates[model.id] = 'pending';
      initialResponses[model.id] = '';
    });

    setStreamingData({
      modelResponses: initialResponses,
      consensusResponse: '',
      agreementScores: [],
      modelStates: initialStates,
      consensusState: 'pending',
      agreementState: 'pending',
    });

    try {
      // --- Build the V2 Payload ---
      const summarizerConfig = selectedModels.find(m => m.id === selectedSummarizer);
      if (!summarizerConfig) {
        throw new Error("Summarizer configuration not found.");
      }

      const payload = {
        prompt,
        configurations: selectedModels.map(m => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          model: m.model,
        })),
        keys: selectedModels.reduce((acc, m) => {
          acc[m.id] = providerKeys[m.provider];
          return acc;
        }, {} as Record<string, string>),
        models: selectedModels.reduce((acc, m) => {
          acc[m.id] = m.model;
          return acc;
        }, {} as Record<string, string>),
        summarizer: {
          configId: summarizerConfig.id,
          provider: summarizerConfig.provider,
          model: summarizerConfig.model,
        },
      };

      const response = await fetch('/api/ensemble-stream-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as {
                type: string;
                configId?: string; // Changed from modelId
                content?: string;
                error?: string;
                scores?: AgreementScore[];
                message?: string; // Added for status updates
                [key: string]: unknown;
              };

              switch (data.type) {
                case 'status':
                  if (typeof data.message === 'string' && data.message.includes('Calculating agreement')) {
                    setStreamingData(prev => ({ ...prev, agreementState: 'calculating' }));
                  }
                  break;
                case 'config_start': // Changed from model_start
                  if (data.configId) {
                    setStreamingData(prev => ({
                      ...prev,
                      modelStates: { ...prev.modelStates, [data.configId!]: 'streaming' }
                    }));
                  }
                  break;

                case 'chunk':
                  if (data.configId && data.content) {
                    setStreamingData(prev => ({
                      ...prev,
                      modelResponses: {
                        ...prev.modelResponses,
                        [data.configId!]: prev.modelResponses[data.configId!] + data.content!
                      }
                    }));
                  }
                  break;

                case 'config_complete': // Changed from model_complete
                  if (data.configId) {
                    setStreamingData(prev => ({
                      ...prev,
                      modelStates: { ...prev.modelStates, [data.configId!]: 'complete' }
                    }));
                  }
                  break;
                
                case 'config_error': // Add this case
                  if (data.configId && data.error) {
                    setStreamingData(prev => ({
                      ...prev,
                      modelStates: { ...prev.modelStates, [data.configId!]: 'error' },
                      modelResponses: {
                        ...prev.modelResponses,
                        [data.configId!]: `Error: ${data.error!}`
                      }
                    }));
                  }
                  break;

                case 'agreement_start':
                  setStreamingData(prev => ({ ...prev, agreementState: 'calculating' }));
                  break;

                case 'agreement':
                  if (data.scores) {
                    setStreamingData(prev => ({ 
                      ...prev, 
                      agreementScores: data.scores!,
                      agreementState: 'complete',
                    }));
                  }
                  break;

                case 'agreement_error':
                  setStreamingData(prev => ({ ...prev, agreementState: 'error' }));
                  break;

                case 'consensus_start':
                  setStreamingData(prev => ({ ...prev, consensusState: 'streaming' }));
                  break;

                case 'consensus_chunk':
                  if (data.content) {
                    setStreamingData(prev => ({
                      ...prev,
                      consensusResponse: prev.consensusResponse + data.content!
                    }));
                  }
                  break;
                case 'consensus_error':
                  setStreamingData(prev => ({ ...prev, consensusState: 'error' }));
                  break;

                case 'complete':
                  setStreamingData(prev => ({ ...prev, consensusState: 'complete' }));
                  break;
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  const getValidationMessage = () => {
    if (selectedModels.length < 2) {
      return "Select at least 2 AI models to start";
    }
    if (!prompt.trim()) {
      return "Enter a prompt to continue";
    }
    if (!selectedSummarizer) {
      return "Select a summarizer model";
    }
    return null;
  };

  const validationMessage = getValidationMessage();
  const canSubmit = !isStreaming && !validationMessage;

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'pending': return '⏳';
      case 'streaming': return '🔄';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'pending': return 'text-gray-400';
      case 'streaming': return 'text-blue-400';
      case 'calculating': return 'text-blue-400';
      case 'complete': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatAgreementScoresForCopy = () => {
    if (streamingData.agreementScores.length === 0) return '';
    
    const modelNameMap = new Map(selectedModels.map(m => [m.id, m.name]));
    
    let result = 'Agreement Analysis Results:\n\n';
    streamingData.agreementScores.forEach(({ id1, id2, score }, index) => {
      const letter = String.fromCharCode(65 + index);
      const model1 = modelNameMap.get(id1)?.split(' ').pop() || id1;
      const model2 = modelNameMap.get(id2)?.split(' ').pop() || id2;
      result += `${letter}: ${model1} <> ${model2}: ${(score * 100).toFixed(0)}%\n`;
    });
    
    return result;
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <Header />

        <div className="space-y-6">
          {/* Configuration Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Configuration</h2>
            <div className="flex flex-wrap gap-4">
              <ProviderConfiguration
                providerKeys={providerKeys}
                onProviderKeysChange={handleProviderKeysChange}
                providerStatus={providerStatus}
                onProviderStatusChange={handleProviderStatusChange}
                availableModels={availableModels}
                onAvailableModelsChange={handleAvailableModelsChange}
              />
              <ModelSelection
                providerKeys={providerKeys}
                availableModels={availableModels}
                selectedModels={selectedModels}
                onSelectedModelsChange={setSelectedModels}
                providerStatus={providerStatus}
              />
            </div>
          </div>

          {/* Selected Models Display */}
          <SelectedModelsDisplay selectedModels={selectedModels} />

          {/* Query Form */}
          <form onSubmit={handleStreamingSubmit} className="space-y-4">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              placeholder="Enter your prompt here..."
            />

            {/* Summarizer Selection */}
            {selectedModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Summarizer Model
                </label>
                <select
                  value={selectedSummarizer}
                  onChange={(e) => setSelectedSummarizer(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select summarizer...</option>
                  {selectedModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col items-end gap-2">
              {validationMessage && (
                <div className="text-sm text-amber-400 text-right">
                  {validationMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-[hsl(280,100%,70%)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[hsl(280,100%,60%)] disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isStreaming ? "Streaming..." : `Compare ${selectedModels.length} Models`}
              </button>
            </div>
          </form>

          {/* Streaming Results */}
          {(isStreaming || streamingData.consensusState === 'complete') && (
            <div className="space-y-6">

              {/* Consensus Response and Agreement Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold mb-4 border-b-2 border-[hsl(280,100%,70%)] pb-2">
                      Consensus Response {getStateIcon(streamingData.consensusState)}
                    </h2>
                    {streamingData.consensusState === 'complete' && <CopyButton textToCopy={streamingData.consensusResponse} />}
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingData.consensusResponse || 
                         (streamingData.consensusState === 'streaming' ? ' ' : 'Waiting for individual responses...')}
                      </ReactMarkdown>
                      {streamingData.consensusState === 'streaming' && !streamingData.consensusResponse && (
                        'Generating consensus...'
                      )}
                      {streamingData.consensusState === 'streaming' && (
                        <span className="animate-pulse">▋</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold border-b-2 border-gray-600 pb-2">
                      Agreement Analysis {getStateIcon(streamingData.agreementState)}
                    </h2>
                    {streamingData.agreementState === 'complete' && streamingData.agreementScores.length > 0 && (
                      <CopyButton textToCopy={formatAgreementScoresForCopy()} />
                    )}
                  </div>
                  {(isStreaming || streamingData.consensusState === 'complete') ? (
                    <ConsensusDiagram scores={streamingData.agreementScores} models={selectedModels} />
                  ) : (
                    <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400 h-[200px] flex items-center justify-center text-sm">
                      {( () => {
                          if (selectedModels.length < 2) {
                            return 'Select at least 2 models to enable agreement analysis.';
                          }
                          if (!selectedModels.some(m => m.provider === 'openai')) {
                            return 'Agreement analysis requires at least one OpenAI model to be selected for generating embeddings.';
                          }
                          return 'Submit a prompt to see agreement analysis.';
                        }
                      )()}
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Model Responses */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Individual Responses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedModels.map(model => (
                    <div key={model.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getProviderColor(model.provider) }}
                        />
                        <h3 className={`font-bold ${getStateColor(streamingData.modelStates[model.id] ?? 'pending')}`}>
                          {model.name} {getStateIcon(streamingData.modelStates[model.id] ?? 'pending')}
                        </h3>
                        {streamingData.modelStates[model.id] === 'complete' && <CopyButton textToCopy={streamingData.modelResponses[model.id] ?? ''} />}
                      </div>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamingData.modelResponses[model.id] || 
                           (streamingData.modelStates[model.id] === 'streaming' ? ' ' : 'Waiting to start...')}
                        </ReactMarkdown>
                        {streamingData.modelStates[model.id] === 'streaming' && !streamingData.modelResponses[model.id] && (
                           'Generating response...'
                        )}
                        {streamingData.modelStates[model.id] === 'streaming' && (
                          <span className="animate-pulse">▋</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
