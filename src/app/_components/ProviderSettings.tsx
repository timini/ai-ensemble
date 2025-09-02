"use client";

export type Provider = "openai" | "google" | "anthropic";
export type KeyStatus = "valid" | "invalid" | "unchecked";

export function ProviderSettings({ provider, title, models, onKeyChange, onModelChange, onValidate, isValidationInProgress, isModelsLoading, keyStatus, currentKey, currentModel, isKeyVisible, toggleKeyVisibility }: { provider: Provider; title: string; models: readonly string[]; onKeyChange: (p: Provider, v: string) => void; onModelChange: (p: Provider, v: string) => void; onValidate: (p: Provider) => void; isValidationInProgress: boolean; isModelsLoading: boolean; keyStatus: KeyStatus; currentKey: string; currentModel: string; isKeyVisible: boolean; toggleKeyVisibility: () => void; }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xl font-bold text-[hsl(280,100%,80%)]">{title}</h3>
      <div className="flex items-center gap-2">
        <input type={isKeyVisible ? "text" : "password"} name={provider} placeholder={`${title} API Key`} value={currentKey} onChange={(e) => onKeyChange(provider, e.target.value)} onBlur={() => onValidate(provider)} className="bg-gray-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] w-full" />
        <div className="w-6 h-6 flex items-center justify-center">{isValidationInProgress ? <span className="animate-spin">⏳</span> : keyStatus === 'valid' ? <span title="Valid key">✅</span> : keyStatus === 'invalid' ? <span title="Invalid or expired key">❌</span> : null}</div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <button onClick={toggleKeyVisibility} className="hover:underline">{isKeyVisible ? "Hide" : "Show"}</button>
        <button onClick={() => navigator.clipboard.writeText(currentKey)} className="hover:underline">Copy</button>
        <button onClick={() => onKeyChange(provider, "")} className="hover:underline text-red-400">Clear</button>
      </div>
      {keyStatus === 'valid' && (isModelsLoading ? <div className="text-sm text-gray-400">Loading models...</div> : <select value={currentModel} onChange={(e) => onModelChange(provider, e.target.value)} className="bg-gray-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)]">{models.map(model => <option key={model} value={model}>{model}</option>)}</select>)}
    </div>
  );
}
