"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { SharedResponse } from '~/types/share';
import { CopyButton } from './CopyButton';

interface SharedResponseViewerProps {
  data: SharedResponse;
}

export function SharedResponseViewer({ data }: SharedResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'consensus' | 'individual' | 'details'>('consensus');

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      openai: 'hsl(140, 70%, 60%)', // Green
      google: 'hsl(220, 90%, 60%)', // Blue  
      anthropic: 'hsl(30, 80%, 60%)', // Orange
      grok: 'hsl(280, 70%, 60%)', // Purple
    };
    return colors[provider as keyof typeof colors] ?? 'hsl(200, 70%, 60%)';
  };

  const agreementPercentage = (score: number) => Math.round(score * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            AI <span className="text-[hsl(280,100%,70%)]">Ensemble</span>
          </h1>
        </Link>
        <p className="text-gray-400">Shared Response</p>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Original Prompt</h2>
          <p className="text-gray-200 leading-relaxed">{data.prompt}</p>
          <div className="mt-3 text-sm text-gray-400 flex justify-between items-center">
            <span>Shared on {formatTimestamp(data.timestamp)}</span>
            <span>ID: {data.id}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'consensus', label: 'Consensus Response' },
          { key: 'individual', label: 'Individual Responses' },
          { key: 'details', label: 'Analysis Details' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[hsl(280,100%,70%)] text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'consensus' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[hsl(280,100%,80%)]">Consensus Response</h3>
              <CopyButton text={data.consensusResponse} />
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                {data.consensusResponse}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Summarized by: <span className="font-medium" style={{ color: getProviderColor(data.summarizer.provider) }}>
                {data.summarizer.provider.charAt(0).toUpperCase() + data.summarizer.provider.slice(1)}
              </span> ({data.summarizer.model})
            </div>
          </div>
        )}

        {activeTab === 'individual' && (
          <div className="space-y-4">
            {Object.entries(data.individualResponses).map(([provider, response]) => (
              <div key={provider} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 
                    className="text-lg font-bold"
                    style={{ color: getProviderColor(provider) }}
                  >
                    {provider.charAt(0).toUpperCase() + provider.slice(1)} Response
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      Model: {data.models[provider as keyof typeof data.models]}
                    </span>
                    <CopyButton text={response} />
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                  {response || 'No response available'}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Agreement Scores */}
            {data.agreementScores && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-[hsl(280,100%,80%)]">Agreement Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {agreementPercentage(data.agreementScores.og)}%
                    </div>
                    <div className="text-sm text-gray-400">OpenAI ↔ Google</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {agreementPercentage(data.agreementScores.ga)}%
                    </div>
                    <div className="text-sm text-gray-400">Google ↔ Anthropic</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {agreementPercentage(data.agreementScores.ao)}%
                    </div>
                    <div className="text-sm text-gray-400">Anthropic ↔ OpenAI</div>
                  </div>
                </div>
              </div>
            )}

            {/* Models Used */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-[hsl(280,100%,80%)]">Models Used</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(data.models).map(([provider, model]) => (
                  <div key={provider} className="flex justify-between items-center">
                    <span 
                      className="font-medium"
                      style={{ color: getProviderColor(provider) }}
                    >
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}:
                    </span>
                    <span className="text-gray-300">{model}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-[hsl(280,100%,80%)]">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Share ID:</span>
                  <span className="font-mono text-gray-300">{data.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-gray-300">{formatTimestamp(data.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prompt Length:</span>
                  <span className="text-gray-300">{data.prompt.length} characters</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-gray-700">
        <Link 
          href="/" 
          className="bg-[hsl(280,100%,70%)] hover:bg-[hsl(280,100%,60%)] text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Try AI Ensemble
        </Link>
        <p className="mt-4 text-gray-400 text-sm">
          Compare. Consensus. Confidence.
        </p>
      </div>
    </div>
  );
}
