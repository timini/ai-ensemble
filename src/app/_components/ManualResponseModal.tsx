"use client";

import { useState } from 'react';
import type { Provider } from '@/types/api';

interface ManualResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddResponse: (provider: Provider, modelName: string, response: string) => void;
}

export function ManualResponseModal({ isOpen, onClose, onAddResponse }: ManualResponseModalProps) {
  const [provider, setProvider] = useState<Provider>('openai');
  const [modelName, setModelName] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modelName.trim() && response.trim()) {
      onAddResponse(provider, modelName.trim(), response.trim());
      // Reset form
      setProvider('openai');
      setModelName('');
      setResponse('');
      onClose();
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setProvider('openai');
    setModelName('');
    setResponse('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Add Manual Response</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-2">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="openai">OpenAI</option>
              <option value="google">Google</option>
              <option value="anthropic">Anthropic</option>
              <option value="grok">Grok</option>
            </select>
          </div>

          <div>
            <label htmlFor="modelName" className="block text-sm font-medium text-gray-300 mb-2">
              Model Name
            </label>
            <input
              id="modelName"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., GPT-4, Claude-3.5-Sonnet, Gemini Pro"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="response" className="block text-sm font-medium text-gray-300 mb-2">
              Response
            </label>
            <textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Paste the AI model's response here..."
              rows={8}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none resize-vertical"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[hsl(280,100%,70%)] text-white font-bold rounded-lg hover:bg-[hsl(280,100%,60%)] disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={!modelName.trim() || !response.trim()}
            >
              Add Response
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
