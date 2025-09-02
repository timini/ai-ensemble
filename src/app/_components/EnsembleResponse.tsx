"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton';
import { ShareButton } from './ShareButton';
import { type Provider } from './ProviderSettings';

interface EnsembleResponseData {
  consensusResponse: string;
  agreementScores: { og: number; ga: number; ao: number };
  individualResponses: Record<Provider, string>;
}

interface EnsembleResponseProps {
  data: EnsembleResponseData;
  consensusDiagram: React.ReactNode;
  prompt?: string;
  models?: Record<Provider, string>;
  summarizer?: {
    provider: Provider;
    model: string;
  };
}

export function EnsembleResponse({ data, consensusDiagram, prompt, models, summarizer }: EnsembleResponseProps) {
  // Create share data if all required props are provided
  const canShare = prompt && models && summarizer;
  const shareData = canShare ? {
    prompt,
    individualResponses: data.individualResponses,
    consensusResponse: data.consensusResponse,
    agreementScores: data.agreementScores,
    models,
    summarizer,
  } : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold border-b-2 border-[hsl(280,100%,70%)] pb-2">Consensus Response</h2>
            {shareData && <ShareButton data={shareData} />}
          </div>
          <div className="bg-gray-800 p-4 rounded-lg relative">
            <div className="prose prose-invert max-w-none whitespace-pre-wrap">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.consensusResponse}</ReactMarkdown>
            </div>
            <CopyButton textToCopy={data.consensusResponse} />
          </div>
        </div>
        <div className="md:col-span-1">
          <h2 className="text-3xl font-bold mb-4 border-b-2 border-gray-600 pb-2">Agreement Analysis</h2>
          {consensusDiagram}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-3">Individual Responses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(data.individualResponses) as Provider[]).map(p => (
            <div key={p} className="bg-gray-800/50 p-4 rounded-lg relative">
              <h3 className="font-bold text-lg mb-2">{p.charAt(0).toUpperCase() + p.slice(1)}</h3>
              <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.individualResponses[p]}</ReactMarkdown>
              </div>
              <CopyButton textToCopy={data.individualResponses[p]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
