"use client";

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export function PromptInput({ prompt, setPrompt }: PromptInputProps) {
  return (
    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your prompt here..." rows={5} className="bg-gray-800 p-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] w-full" />
  );
}
