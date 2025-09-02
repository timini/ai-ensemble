"use client";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PromptInput({ value, onChange, placeholder }: PromptInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className="bg-gray-800 p-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] w-full"
    />
  );
}
