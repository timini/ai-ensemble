"use client";

interface PromptInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  placeholder?: string;
}

export function PromptInput({ prompt, setPrompt, placeholder = "Enter your prompt here..." }: PromptInputProps) {
  return (
    <textarea
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className="bg-gray-800 p-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] w-full"
    />
  );
}
