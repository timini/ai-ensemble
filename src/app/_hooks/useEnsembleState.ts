import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '~/trpc/react';
import { type Provider, type KeyStatus } from '../_components/ProviderSettings';
import { FALLBACK_MODELS } from '~/utils/constants';

export function useEnsembleState() {
  console.log("useEnsembleState: Render");
  const [prompt, setPrompt] = useState("");
  const [keys, setKeys] = useState<Record<Provider, string>>({ openai: "", google: "", anthropic: "" });
  const [models, setModels] = useState<Record<Provider, string>>({ openai: FALLBACK_MODELS.openai[0]!, google: FALLBACK_MODELS.google[0]!, anthropic: FALLBACK_MODELS.anthropic[0]! });
  const [keyStatus, setKeyStatus] = useState<Record<Provider, KeyStatus>>({ openai: "unchecked", google: "unchecked", anthropic: "unchecked" });
  const [validationInProgress, setValidationInProgress] = useState<Set<Provider>>(new Set());
  const [modelsLoading, setModelsLoading] = useState<Set<Provider>>(new Set());
  const [isKeyVisible, setIsKeyVisible] = useState<Set<Provider>>(new Set());
  const [modelLists, setModelLists] = useState<Record<Provider, string[]>>(FALLBACK_MODELS);
  const [summarizerSelection, setSummarizerSelection] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  const utils = api.useUtils();

  const validateAllKeysMutation = api.validation.validateAllKeys.useMutation({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: useCallback((data: any) => {
          console.log("validateAllKeysMutation: onSuccess");
          setKeyStatus(data.statuses);
          setModelLists(data.modelLists);
      }, [setKeyStatus, setModelLists]),
      onSettled: useCallback(() => {
          console.log("validateAllKeysMutation: onSettled");
          setInitialLoad(false);
      }, [setInitialLoad])
  });

  const validateApiKeyMutation = api.validation.validateApiKey.useMutation({
    onSuccess: (data, variables) => {
      const newStatus = data.success ? "valid" : "invalid";
      setKeyStatus(prev => ({ ...prev, [variables.provider]: newStatus }));
      if (newStatus === 'valid') {
        setModelsLoading(prev => new Set(prev).add(variables.provider));
        void utils.validation.getModels.fetch({ provider: variables.provider, key: variables.key })
          .then(data => {
            if (data && data.length > 0) {
              setModelLists(prev => ({ ...prev, [variables.provider]: data }));
              setModels(prev => ({ ...prev, [variables.provider]: data[0]! }));
            }
          })
          .finally(() => {
            setModelsLoading(prev => { const s = new Set(prev); s.delete(variables.provider); return s; });
          });
      }
    },
    onError: (error, variables) => setKeyStatus(prev => ({ ...prev, [variables.provider]: "invalid" })),
    onSettled: (data, error, variables) => setValidationInProgress(prev => { const s = new Set(prev); s.delete(variables.provider); return s; }),
  });

  const handleValidateKey = useCallback((provider: Provider) => {
    const key = keys[provider];
    if (!key || validationInProgress.has(provider)) return;
    setValidationInProgress(prev => new Set(prev).add(provider));
    void validateApiKeyMutation.mutate({ provider, key });
  }, [keys, validationInProgress, validateApiKeyMutation]);

  // NOTE: `models` and `validateAllKeysMutation` are intentionally omitted from the dependency array.
  // Including them would cause an infinite loop due to state updates and mutation re-creation.
  // The effect is designed to run only once on component mount to load initial data.
  useEffect(() => {
    console.log("useEffect: Loading saved keys and models");
    const savedKeys = JSON.parse(localStorage.getItem("ai-ensemble-keys") ?? "{}");
    const savedModelsJSON = localStorage.getItem("ai-ensemble-models");
    
    const sanitizedModels = { ...models };
    if (savedModelsJSON) {
      const savedModels = JSON.parse(savedModelsJSON);
      (Object.keys(savedModels) as Provider[]).forEach(provider => {
        if (FALLBACK_MODELS[provider].includes(savedModels[provider])) {
          sanitizedModels[provider] = savedModels[provider];
        } else {
          sanitizedModels[provider] = FALLBACK_MODELS[provider][0]!;
        }
      });
    }
    console.log("useEffect: Calling setKeys");
    setKeys(savedKeys);
    console.log("useEffect: Calling setModels");
    setModels(sanitizedModels);

    console.log("useEffect: Calling validateAllKeysMutation.mutate");
    validateAllKeysMutation.mutate(savedKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyChange = (provider: Provider, value: string) => {
    const newKeys = { ...keys, [provider]: value };
    setKeys(newKeys);
    localStorage.setItem("ai-ensemble-keys", JSON.stringify(newKeys));
    setKeyStatus({ ...keyStatus, [provider]: "unchecked" });
  };

  const handleModelChange = (provider: Provider, value: string) => {
    const newModels = { ...models, [provider]: value };
    setModels(newModels);
    localStorage.setItem("ai-ensemble-models", JSON.stringify(newModels));
  };

  const ensembleQuery = api.ensemble.query.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summarizerSelection) return;
    const [provider, model] = summarizerSelection.split(":");
    if (!provider || !model) return; // Add this check
    void ensembleQuery.mutate({ prompt, keys, models, summarizer: { provider: provider as Provider, model } });
  };

  const validProviders = useMemo(() => 
    (Object.keys(keyStatus) as Provider[]).filter(p => keyStatus[p] === 'valid')
  , [keyStatus]);

  useEffect(() => {
    if (validProviders.length > 0) {
        const currentProvider = summarizerSelection.split(":")[0];
        if (!summarizerSelection || !validProviders.includes(currentProvider as Provider)) {
            const firstValidProvider = validProviders[0]!;
            const firstModel = modelLists[firstValidProvider]?.[0] ?? FALLBACK_MODELS[firstValidProvider][0]!;
            const newSummarizerSelection = `${firstValidProvider}:${firstModel}`;
            if (newSummarizerSelection !== summarizerSelection) {
                setSummarizerSelection(newSummarizerSelection);
            }
        }
    }
  }, [validProviders, modelLists, summarizerSelection]);

  return {
    prompt, setPrompt,
    keys, handleKeyChange,
    models, handleModelChange,
    keyStatus, handleValidateKey,
    summarizerSelection, setSummarizerSelection,
    handleSubmit,
    ensembleQuery,
    validProviders,
    modelLists,
    initialLoad,
    validationInProgress,
    modelsLoading,
    isKeyVisible, setIsKeyVisible,
  };
}