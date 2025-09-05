"use client";

import { type Provider } from '@/types/api';

interface SummarizerSelectionProps {
  summarizerSelection: string;
  setSummarizerSelection: (selection: string) => void;
  validProviders: Provider[];
  modelLists: Record<Provider, string[]>;
}

export function SummarizerSelection({ summarizerSelection, setSummarizerSelection, validProviders, modelLists }: SummarizerSelectionProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="summarizer" className="text-gray-400">Summarizer:</label>
      <select id="summarizer" value={summarizerSelection} onChange={(e) => setSummarizerSelection(e.target.value)} className="bg-gray-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] min-w-[200px]">
        {validProviders.length === 0 && <option>Enter a valid API key to select a summarizer</option>}
        {validProviders.map(p => (<optgroup key={p} label={p.charAt(0).toUpperCase() + p.slice(1)}>{(modelLists[p] ?? []).map(m => <option key={`${p}:${m}`} value={`${p}:${m}`}>{m}</option>)}</optgroup>))}
      </select>
    </div>
  );
}
