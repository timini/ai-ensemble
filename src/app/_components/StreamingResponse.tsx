"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton';
import { type Provider } from '@/types/api';
import type { AgreementScores } from '@/types/agreement';

interface StreamingResponseProps {
  streamingData: {
    individualResponses: Record<Provider, string>;
    consensusResponse: string;
    agreementScores: { og: number; ga: number; ao: number } | AgreementScores | null;
    providerStates: Record<Provider, 'pending' | 'streaming' | 'complete' | 'error'>;
    consensusState: 'pending' | 'streaming' | 'complete';
  };
  consensusDiagram: React.ReactNode;
}

export function StreamingResponse({ streamingData, consensusDiagram }: StreamingResponseProps) {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'pending': return 'text-gray-400';
      case 'streaming': return 'text-blue-400';
      case 'complete': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'pending': return '⏳';
      case 'streaming': return '🔄';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
          <h2 className="text-3xl font-bold mb-4 border-b-2 border-[hsl(280,100%,70%)] pb-2">
            Consensus Response {getStateIcon(streamingData.consensusState)}
          </h2>
          <div className="bg-gray-800 p-4 rounded-lg relative">
            <div className="prose prose-invert max-w-none whitespace-pre-wrap">
              {streamingData.consensusResponse ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingData.consensusResponse}
                </ReactMarkdown>
              ) : (
                <div className="text-gray-400 italic">
                  {streamingData.consensusState === 'pending' ? 
                    'Waiting for individual responses to complete...' : 
                    'Generating consensus...'}
                </div>
              )}
              {streamingData.consensusState === 'streaming' && (
                <span className="animate-pulse">▋</span>
              )}
            </div>
            {streamingData.consensusResponse && (
              <CopyButton textToCopy={streamingData.consensusResponse} />
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          <h2 className="text-3xl font-bold mb-4 border-b-2 border-gray-600 pb-2">Agreement Analysis</h2>
          {streamingData.agreementScores ? (
            consensusDiagram
          ) : (
            <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">
              Calculating agreement scores...
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-3">Individual Responses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(streamingData.individualResponses) as Provider[]).map(provider => (
            <div key={provider} className="bg-gray-800/50 p-4 rounded-lg relative">
              <h3 className={`font-bold text-lg mb-2 ${getStateColor(streamingData.providerStates[provider])}`}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)} {getStateIcon(streamingData.providerStates[provider])}
              </h3>
              <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
                {streamingData.individualResponses[provider] ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingData.individualResponses[provider]}
                  </ReactMarkdown>
                ) : (
                  <div className="text-gray-400 italic">
                    {streamingData.providerStates[provider] === 'pending' ? 
                      'Waiting to start...' :
                      streamingData.providerStates[provider] === 'error' ?
                      'Error occurred' : 
                      'Generating response...'}
                  </div>
                )}
                {streamingData.providerStates[provider] === 'streaming' && (
                  <span className="animate-pulse">▋</span>
                )}
              </div>
              {streamingData.individualResponses[provider] && (
                <CopyButton textToCopy={streamingData.individualResponses[provider]} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
