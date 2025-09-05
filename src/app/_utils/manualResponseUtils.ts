import type { Provider } from '../_components/ProviderSettings';
import type { SelectedModel } from '../_components/ModelSelection';

export interface ManualResponse {
  provider: Provider;
  modelName: string;
  response: string;
}

export type ManualResponseState = Record<string, ManualResponse>;

/**
 * Converts manual responses to the expected format (id -> response string)
 * for use in API calls
 */
export function createAllResponses(
  streamingDataResponses: Record<string, string>,
  manualResponses: ManualResponseState,
  manualId: string,
  response: string
): Record<string, string> {
  const manualResponseStrings = Object.entries(manualResponses).reduce((acc, [id, manualResponse]) => {
    acc[id] = manualResponse.response;
    return acc;
  }, {} as Record<string, string>);

  return {
    ...streamingDataResponses,
    ...manualResponseStrings,
    [manualId]: response
  };
}

/**
 * Converts existing manual responses to model objects and adds the new one
 */
export function createAllModels(
  selectedModels: SelectedModel[],
  manualResponses: ManualResponseState,
  manualId: string,
  provider: Provider,
  modelName: string
): SelectedModel[] {
  // Convert existing manual responses to model objects
  const existingManualModels = Object.entries(manualResponses).map(([id, manualResponse]) => ({
    id,
    name: `${manualResponse.provider.charAt(0).toUpperCase() + manualResponse.provider.slice(1)} - ${manualResponse.modelName}`,
    provider: manualResponse.provider,
    model: manualResponse.modelName
  }));
  
  return [
    ...selectedModels,
    ...existingManualModels,
    { id: manualId, name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} - ${modelName}`, provider, model: modelName }
  ];
}

/**
 * Creates a mapping of model IDs to API keys
 * Manual responses use a special placeholder key
 */
export function createKeysMapping(
  allModels: Array<{ id: string; provider: Provider }>,
  providerKeys: Record<Provider, string>
): Record<string, string> {
  return allModels.reduce((acc, m) => {
    // For manual responses, we don't need API keys
    if (m.id.startsWith('manual-')) {
      acc[m.id] = 'manual-response';
    } else {
      acc[m.id] = providerKeys[m.provider];
    }
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Creates a mapping of model IDs to model names
 */
export function createModelsMapping(
  allModels: Array<{ id: string; model: string }>
): Record<string, string> {
  return allModels.reduce((acc, m) => {
    acc[m.id] = m.model;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Generates a unique ID for manual responses
 */
let manualResponseCounter = 0;
export function generateManualResponseId(): string {
  manualResponseCounter++;
  return `manual-${Date.now()}-${manualResponseCounter}`;
}

/**
 * Validates manual response data
 */
export function validateManualResponse(
  provider: Provider,
  modelName: string,
  response: string
): { isValid: boolean; error?: string } {
  if (!provider) {
    return { isValid: false, error: 'Provider is required' };
  }
  
  if (!modelName.trim()) {
    return { isValid: false, error: 'Model name is required' };
  }
  
  if (!response.trim()) {
    return { isValid: false, error: 'Response is required' };
  }
  
  return { isValid: true };
}
