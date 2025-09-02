"use client";

import { useState } from 'react';
import { useModelConfigurations } from '../_hooks/useModelConfigurations';
import { ModelConfigurationManager } from './ModelConfigurationManager';
import { PromptInput } from './PromptInput';
import { Header } from './Header';
// import type { ModelConfiguration } from '~/types/modelConfig';
import { getProviderColor } from '~/types/modelConfig';
import { ConsensusDiagram } from './ConsensusDiagram';

interface StreamingData {
  configResponses: Record<string, string>;
  consensusResponse: string;
  agreementScores: Record<string, number>;
  configStates: Record<string, 'pending' | 'streaming' | 'complete' | 'error'>;
  consensusState: 'pending' | 'streaming' | 'complete';
}

export function ModelConfigurationInterface() {
  const {
    configurations,
    enabledConfigurations,
    availableModels,
    // isValidating,
    validationResults,
    isReadyForStreaming,
    updateConfiguration,
    setConfigurations,
    getStreamingPayload,
  } = useModelConfigurations();

  const [prompt, setPrompt] = useState("");
  const [selectedSummarizer, setSelectedSummarizer] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingData, setStreamingData] = useState<StreamingData>({
    configResponses: {},
    consensusResponse: '',
    agreementScores: {},
    configStates: {},
    consensusState: 'pending'
  });

  // Auto-select first enabled config as summarizer if none selected
  if (!selectedSummarizer && enabledConfigurations.length > 0) {
    setSelectedSummarizer(enabledConfigurations[0]!.id);
  }

  const handleStreamingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || !selectedSummarizer || !isReadyForStreaming) {
      return;
    }

    setIsStreaming(true);
    
    // Initialize streaming data
    const initialStates: Record<string, 'pending' | 'streaming' | 'complete' | 'error'> = {};
    const initialResponses: Record<string, string> = {};
    
    enabledConfigurations.forEach(config => {
      initialStates[config.id] = 'pending';
      initialResponses[config.id] = '';
    });

    setStreamingData({
      configResponses: initialResponses,
      consensusResponse: '',
      agreementScores: {},
      configStates: initialStates,
      consensusState: 'pending'
    });

    try {
      const payload = getStreamingPayload(prompt, { configId: selectedSummarizer });

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
                configId?: string;
                content?: string;
                error?: string;
                response?: string;
                scores?: Record<string, number>;
                consensusResponse?: string;
                [key: string]: unknown;
              };

              switch (data.type) {
                case 'config_start':
                  if (data.configId) {
                    setStreamingData(prev => ({
                      ...prev,
                      configStates: { ...prev.configStates, [data.configId!]: 'streaming' }
                    }));
                  }
                  break;

                case 'chunk':
                  if (data.configId && data.content) {
                    setStreamingData(prev => ({
                      ...prev,
                      configResponses: {
                        ...prev.configResponses,
                        [data.configId!]: prev.configResponses[data.configId!] + data.content!
                      }
                    }));
                  }
                  break;

                case 'config_complete':
                  if (data.configId) {
                    setStreamingData(prev => ({
                      ...prev,
                      configStates: { ...prev.configStates, [data.configId!]: 'complete' }
                    }));
                  }
                  break;

                case 'config_error':
                  if (data.configId) {
                    setStreamingData(prev => ({
                      ...prev,
                      configStates: { ...prev.configStates, [data.configId!]: 'error' }
                    }));
                  }
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

                case 'agreement':
                  if (data.scores) {
                    setStreamingData(prev => ({ ...prev, agreementScores: data.scores! }));
                  }
                  break;

                case 'complete':
                  setStreamingData(prev => ({ ...prev, consensusState: 'complete' }));
                  break;

                case 'error':
                  console.error('Streaming error:', data.error);
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
    if (enabledConfigurations.length < 2) {
      return "Configure at least 2 AI models to start";
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
      case 'complete': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <Header />

        <div className="flex flex-col gap-6">
          {/* Model Configuration Management */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Model Configurations</h2>
            <ModelConfigurationManager
              configurations={configurations}
              onConfigurationsChange={setConfigurations}
              availableModels={availableModels}
            />
          </div>

          {/* Active Configurations Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledConfigurations.map(config => (
              <div key={config.id} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getProviderColor(config.provider) }}
                  />
                  <div className="font-medium">{config.name}</div>
                  <div className={`text-sm ${
                    validationResults[config.id] === 'valid' 
                      ? 'text-green-400' 
                      : validationResults[config.id] === 'invalid'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    {validationResults[config.id] === 'valid' ? '✓' : 
                     validationResults[config.id] === 'invalid' ? '✗' : '?'}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {config.provider.charAt(0).toUpperCase() + config.provider.slice(1)} • {config.model}
                </div>
                <div className="mt-2">
                  <input
                    type="password"
                    placeholder="API Key"
                    value={config.apiKey}
                    onChange={(e) => updateConfiguration(config.id, { apiKey: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Query Form */}
          <form onSubmit={handleStreamingSubmit} className="flex flex-col gap-4">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              placeholder="Enter your prompt here..."
            />

            {/* Summarizer Selection */}
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
                {enabledConfigurations.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.name} ({config.provider})
                  </option>
                ))}
              </select>
            </div>

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
                {isStreaming ? "Streaming..." : `Stream with ${enabledConfigurations.length} models`}
              </button>
            </div>
          </form>

          {/* Streaming Results */}
          {(isStreaming || streamingData.consensusState === 'complete') && (
            <div className="mt-8 space-y-6">
              {/* Individual Model Responses */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Model Responses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enabledConfigurations.map(config => (
                    <div key={config.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getProviderColor(config.provider) }}
                        />
                        <h3 className={`font-bold ${getStateColor(streamingData.configStates[config.id] ?? 'pending')}`}>
                          {config.name} {getStateIcon(streamingData.configStates[config.id] ?? 'pending')}
                        </h3>
                      </div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap">
                        {streamingData.configResponses[config.id] ?? (
                          streamingData.configStates[config.id] === 'pending' ? 
                            'Waiting to start...' : 'Generating response...'
                        )}
                        {streamingData.configStates[config.id] === 'streaming' && (
                          <span className="animate-pulse">▋</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consensus Response and Agreement Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold mb-4 border-b-2 border-[hsl(280,100%,70%)] pb-2">
                    Consensus Response {getStateIcon(streamingData.consensusState)}
                  </h2>
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="text-gray-200 whitespace-pre-wrap">
                      {streamingData.consensusResponse || (
                        streamingData.consensusState === 'pending' ? 
                          'Waiting for individual responses...' : 'Generating consensus...'
                      )}
                      {streamingData.consensusState === 'streaming' && (
                        <span className="animate-pulse">▋</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-1">
                  <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-600 pb-2">Agreement Analysis</h2>
                  {Object.keys(streamingData.agreementScores).length > 0 ? (
                    <ConsensusDiagram scores={streamingData.agreementScores} />
                  ) : (
                    <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">
                      {enabledConfigurations.length >= 2 ? 'Calculating agreement scores...' : 'Need at least 2 models for agreement analysis'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
