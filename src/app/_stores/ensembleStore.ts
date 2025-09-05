"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Provider, KeyStatus } from "@/types/api";

export interface SelectedModelState {
  id: string;
  name: string;
  provider: Provider;
  model: string;
  isManual?: boolean;
  manualResponse?: string;
}

export interface StreamingState {
  modelResponses: Record<string, string>;
  consensusResponse: string;
  agreementScores: Array<{ id1: string; id2: string; score: number }>;
  modelStates: Record<string, "pending" | "streaming" | "complete" | "error">;
  consensusState: "pending" | "streaming" | "complete" | "error";
  agreementState: "pending" | "calculating" | "complete" | "error";
}

export interface ManualResponseEntry {
  provider: Provider;
  modelName: string;
  response: string;
}

interface EnsembleStoreState {
  prompt: string;
  providerKeys: Record<Provider, string>;
  providerStatus: Record<Provider, KeyStatus>;
  availableModels: Record<Provider, string[]>;
  selectedModels: SelectedModelState[];
  summarizerSelectedId: string;
  isStreaming: boolean;
  streaming: StreamingState;
  manualResponses: Record<string, ManualResponseEntry>;

  setPrompt: (v: string) => void;
  setProviderKey: (p: Provider, v: string) => void;
  setProviderStatus: (partial: Partial<Record<Provider, KeyStatus>>) => void;
  setAvailableModels: (partial: Partial<Record<Provider, string[]>>) => void;
  setSelectedModels: (models: SelectedModelState[]) => void;
  addSelectedModel: (m: SelectedModelState) => void;
  removeSelectedModel: (id: string) => void;
  setSummarizerSelectedId: (id: string) => void;
  setIsStreaming: (v: boolean) => void;
  setStreaming: (updater: (prev: StreamingState) => StreamingState) => void;
  setManualResponses: (updater: (prev: Record<string, ManualResponseEntry>) => Record<string, ManualResponseEntry>) => void;
}

const initialStreaming: StreamingState = {
  modelResponses: {},
  consensusResponse: "",
  agreementScores: [],
  modelStates: {},
  consensusState: "pending",
  agreementState: "pending",
};

export const useEnsembleStore = create<EnsembleStoreState>()(
  persist(
    (set) => ({
      prompt: "",
      providerKeys: { openai: "", google: "", anthropic: "", grok: "" },
      providerStatus: { openai: "unchecked", google: "unchecked", anthropic: "unchecked", grok: "unchecked" },
      availableModels: { openai: [], google: [], anthropic: [], grok: [] },
      selectedModels: [],
      summarizerSelectedId: "",
      isStreaming: false,
      streaming: initialStreaming,
      manualResponses: {},

      setPrompt: (v) => set({ prompt: v }),
      setProviderKey: (p, v) => set((s) => ({ providerKeys: { ...s.providerKeys, [p]: v } })),
      setProviderStatus: (partial) => set((s) => ({ providerStatus: { ...s.providerStatus, ...partial } })),
      setAvailableModels: (partial) => set((s) => ({ availableModels: { ...s.availableModels, ...partial } })),
      setSelectedModels: (models) => set({ selectedModels: models }),
      addSelectedModel: (m) => set((s) => ({ selectedModels: s.selectedModels.some(x => x.id === m.id) ? s.selectedModels : [...s.selectedModels, m] })),
      removeSelectedModel: (id) => set((s) => ({ selectedModels: s.selectedModels.filter(m => m.id !== id) })),
      setSummarizerSelectedId: (id) => set({ summarizerSelectedId: id }),
      setIsStreaming: (v) => set({ isStreaming: v }),
      setStreaming: (updater) => set((s) => ({ streaming: updater(s.streaming) })),
      setManualResponses: (updater) => set((s) => ({ manualResponses: updater(s.manualResponses) })),
    }),
    {
      name: "ensemble-store",
      partialize: (state) => ({
        prompt: state.prompt,
        providerKeys: state.providerKeys,
        availableModels: state.availableModels,
        selectedModels: state.selectedModels,
        summarizerSelectedId: state.summarizerSelectedId,
        manualResponses: state.manualResponses,
      }),
    }
  )
);


