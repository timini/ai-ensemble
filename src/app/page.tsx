"use client";

import { Header } from "./_components/Header";
import { QueryForm } from "./_components/QueryForm";
import { StreamingResponse } from "./_components/StreamingResponse";
import { useEnsembleState } from "./_hooks/useEnsembleState";

export default function Home() {
  const {
    prompt, setPrompt,
    keys, handleKeyChange,
    models, handleModelChange,
    keyStatus, handleValidateKey,
    summarizerSelection, setSummarizerSelection,
    handleSubmit,
    handleStreamingSubmit,
    ensembleQuery,
    validProviders,
    modelLists,
    initialLoad,
    validationInProgress,
    modelsLoading,
    isKeyVisible, setIsKeyVisible,
    isStreaming,
    streamingData,
  } = useEnsembleState();

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <Header />
        <QueryForm
          prompt={prompt}
          setPrompt={setPrompt}
          keys={keys}
          handleKeyChange={handleKeyChange}
          models={models}
          handleModelChange={handleModelChange}
          keyStatus={keyStatus}
          handleValidateKey={handleValidateKey}
          summarizerSelection={summarizerSelection}
          setSummarizerSelection={setSummarizerSelection}
          handleSubmit={handleSubmit}
          handleStreamingSubmit={handleStreamingSubmit}
          ensembleQueryIsPending={ensembleQuery.isPending}
          validProviders={validProviders}
          modelLists={modelLists}
          initialLoad={initialLoad}
          validationInProgress={validationInProgress}
          modelsLoading={modelsLoading}
          isKeyVisible={isKeyVisible}
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          toggleKeyVisibility={(p) => setIsKeyVisible(prev => { const s = new Set(prev); s.has(p) ? s.delete(p) : s.add(p); return s; })}
          isStreaming={isStreaming}
        />
        <div className="mt-8">
          {/* Streaming responses */}
          {(isStreaming || streamingData.consensusState === 'complete') && (
            <StreamingResponse 
              streamingData={streamingData} 
              consensusDiagram={streamingData.agreementScores ? <ConsensusDiagram scores={streamingData.agreementScores} /> : null} 
            />
          )}
        </div>
      </div>
    </main>
  );
}

function ConsensusDiagram({ scores }: { scores: { og: number; ga: number; ao: number } }) {
    const size = 200;
    const radius = 50;
    const center = size / 2;

    const scoreToDistance = (score: number) => (1 - score) * radius * 0.5;

    const pos = {
        openai: { x: center, y: center - radius / 1.5 },
        google: { x: center - radius * 0.866, y: center + radius / 2 },
        anthropic: { x: center + radius * 0.866, y: center + radius / 2 },
    };

    const avgSimilarity = {
        openai: (scores.og + scores.ao) / 2,
        google: (scores.og + scores.ga) / 2,
        anthropic: (scores.ga + scores.ao) / 2,
    };

    const finalPos = {
        openai: { x: pos.openai.x, y: pos.openai.y + scoreToDistance(avgSimilarity.openai) },
        google: { x: pos.google.x + scoreToDistance(avgSimilarity.google) * 0.866, y: pos.google.y - scoreToDistance(avgSimilarity.google) * 0.5 },
        anthropic: { x: pos.anthropic.x - scoreToDistance(avgSimilarity.anthropic) * 0.866, y: pos.anthropic.y - scoreToDistance(avgSimilarity.anthropic) * 0.5 },
    };

    const COLORS = { openai: '#74A9FF', google: '#FFC107', anthropic: '#DE8BFF' };

    const getScoreColor = (score: number) => {
        const percentage = score * 100;
        if (percentage < 25) return "text-red-500";
        if (percentage < 50) return "text-orange-500";
        if (percentage < 75) return "text-yellow-500";
        return "text-green-500";
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <circle cx={finalPos.openai.x} cy={finalPos.openai.y} r={radius} fill={COLORS.openai} opacity={0.5} filter="url(#glow)" />
                <circle cx={finalPos.google.x} cy={finalPos.google.y} r={radius} fill={COLORS.google} opacity={0.5} filter="url(#glow)" />
                <circle cx={finalPos.anthropic.x} cy={finalPos.anthropic.y} r={radius} fill={COLORS.anthropic} opacity={0.5} filter="url(#glow)" />
                <text x={finalPos.openai.x} y={finalPos.openai.y} textAnchor="middle" dy=".3em" fill="white" className="font-bold">O</text>
                <text x={finalPos.google.x} y={finalPos.google.y} textAnchor="middle" dy=".3em" fill="white" className="font-bold">G</text>
                <text x={finalPos.anthropic.x} y={finalPos.anthropic.y} textAnchor="middle" dy=".3em" fill="white" className="font-bold">A</text>
            </svg>
            <div className="text-xs text-center text-gray-400 mt-2 grid grid-cols-3 gap-2 w-full">
                <span className={getScoreColor(scores.og)}>O-G: {(scores.og * 100).toFixed(0)}%</span>
                <span className={getScoreColor(scores.ga)}>G-A: {(scores.ga * 100).toFixed(0)}%</span>
                <span className={getScoreColor(scores.ao)}>A-O: {(scores.ao * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full mt-4">
                <h4 className="text-sm font-bold mb-2 text-center">Agreement Scale</h4>
                <div className="flex justify-between text-xs px-2">
                    <span className="text-red-500">Low</span>
                    <span className="text-orange-500">Medium</span>
                    <span className="text-yellow-500">High</span>
                    <span className="text-green-500">Very High</span>
                </div>
                <div className="w-full h-2 flex mt-1 rounded-full overflow-hidden">
                    <div className="w-1/4 bg-red-500"></div>
                    <div className="w-1/4 bg-orange-500"></div>
                    <div className="w-1/4 bg-yellow-500"></div>
                    <div className="w-1/4 bg-green-500"></div>
                </div>
            </div>
        </div>
    );
}