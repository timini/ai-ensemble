# Model Selection Component Specification

This document provides a complete technical specification for the `ModelSelection` component, as seen in the screenshot, which allows users to select AI models for comparison.

## 1. Overview & Purpose

The `ModelSelection` component is a popover menu that provides an interface for users to select between 2 and 8 AI models from a list of available providers. It displays currently selected models and lists all available models grouped by their provider.

## 2. Visual Design & Layout

### 2.1. Trigger Button
- **Appearance**: A bright blue button showing the current selection count.
  - `bg-blue-600`, `hover:bg-blue-700`, `rounded-lg`, `px-4`, `py-2`.
- **Text**: "Select Models (X/8)", where X is `selectedModels.length`.
- **Iconography**:
  - Target icon `<span>🎯</span>` on the left.
  - Arrow icon `<span>▼</span>` on the right, which rotates 180 degrees when the menu is open.

### 2.2. Popover Container
- **Appearance**: A large, dark gray, scrollable popover.
  - `absolute`, `w-[500px]`, `bg-gray-800`, `border`, `border-gray-600`, `rounded-lg`, `shadow-lg`, `z-50`, `p-4`, `max-h-[600px]`, `overflow-y-auto`.
- **Header**:
  - Title: "Model Selection" (`text-lg font-bold text-white`).
  - Description: "Choose 2-8 AI models..." (`text-sm text-gray-400`).
- **Footer**:
  - Displays "Selected: X/8 models" on the left.
  - A "Done" button on the right to close the popover.

### 2.3. "Selected Models" Section
- **Title**: `text-md font-medium text-white`.
- **List Item**: A dark gray, rounded container for each selected model.
  - **Layout**: `flex items-center justify-between`, `p-3`, `bg-gray-700`, `rounded-lg`.
  - **Left Side**:
    - Provider's colored dot.
    - Model's display name (`model.name`): `text-white font-medium`.
    - Model's technical ID (`model.model`): `text-xs text-gray-400`.
  - **Right Side (Remove Button)**:
    - `button` with a `✕` icon.
    - **Enabled State**: `bg-red-600 hover:bg-red-700`.
    - **Disabled State**: `bg-gray-600 text-gray-400 cursor-not-allowed`.

### 2.4. "Available Models" Section
- **Title**: `text-md font-medium text-white`.
- **Provider Group**: A bordered card for each configured provider.
  - **Layout**: `border border-gray-600 rounded-lg p-4`.
  - **Header**: `flex items-center gap-3`.
    - Provider's colored dot.
    - Provider's name: `font-medium text-white`.
    - Model count: `text-xs text-gray-400`.
- **Model Item (Button)**:
  - **Layout**: `flex justify-between items-center`, `text-left`, `p-2`, `rounded`, `text-sm`.
  - **Icon**: `+` to add, `✓` if already selected.
  - **States & Styling**:
    - **Default**: `bg-gray-700 hover:bg-gray-600 text-white`.
    - **Already Selected**: `bg-green-900/30 text-green-400 cursor-not-allowed`.
    - **Max Models Reached**: `bg-gray-700 text-gray-400 cursor-not-allowed`.

## 3. Data Structures

### 3.1. Props Interface

```typescript
interface ModelSelectionProps {
  // All keys, used to determine which providers are configured
  providerKeys: Record<Provider, string>;
  
  // Validation status, used to filter to valid providers
  providerStatus: Record<Provider, 'valid' | 'invalid' | 'unchecked'>;

  // A map of provider to a list of its available model names
  availableModels: Record<Provider, string[]>;

  // The current array of selected models
  selectedModels: SelectedModel[];
  
  // Callback to update the parent component's state
  onSelectedModelsChange: (models: SelectedModel[]) => void;
}
```

### 3.2. `SelectedModel` Interface

```typescript
export interface SelectedModel {
  id: string; // Unique ID, e.g., "openai-gpt-4o-mini-1678886400000"
  name: string; // Display name, e.g., "Openai gpt-4o-mini"
  provider: Provider; // e.g., "openai"
  model: string; // Technical model ID, e.g., "gpt-4o-mini"
  isManual?: boolean;
  manualResponse?: string;
}

type Provider = 'openai' | 'google' | 'anthropic' | 'grok';
```

## 4. Behavior & Logic

- **Opening/Closing**: The popover's visibility is controlled by the internal `isOpen` state, toggled by the trigger and "Done" buttons.
- **Provider List**: The "Available Models" section only displays providers that have a valid, non-empty API key (`providerStatus[provider] === 'valid'`).
- **Adding a Model**:
  - Clicking the `+` button on an available model calls the `addModel` function.
  - A new `SelectedModel` object is created with a unique ID.
  - The `onSelectedModelsChange` callback is fired with the updated array.
- **Removing a Model**:
  - Clicking the `✕` button calls the `removeModel` function.
  - The model is filtered out of the `selectedModels` array.
  - The `onSelectedModelsChange` callback is fired.
- **Business Rules & Constraints**:
  - A user must select between **2 and 8 models**.
  - The "Remove" button is disabled when `selectedModels.length <= 2`.
  - The "Add" buttons are disabled when `selectedModels.length >= 8`.
  - An "Add" button for a model is disabled if that specific model has already been added to the `selectedModels` list.

## 5. Component Structure (React/JSX Snippet)

```jsx
export function ModelSelection({ ...props }) {
  const [isOpen, setIsOpen] = useState(false);

  // ... addModel, removeModel logic
  // ... canAddModel, canRemoveModel constants

  const configuredProviders = // ... filter logic based on props

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button onClick={() => setIsOpen(!isOpen)}>...</button>

      {isOpen && (
        <div className="absolute ...">
          {/* Header */}
          <h3>Model Selection</h3>
          <p>...</p>

          {/* Selected Models Section */}
          {selectedModels.length > 0 && (
            <div>
              <h4>Selected Models</h4>
              {selectedModels.map((model) => (
                <div key={model.id}>
                  {/* ... model info and remove button */}
                </div>
              ))}
            </div>
          )}

          {/* Available Models Section */}
          <div>
            <h4>Available Models</h4>
            {configuredProviders.map((provider) => (
              <div key={provider}>
                {/* Provider Header */}
                <h5>{provider}</h5>
                {/* List of available model buttons */}
                {availableModels[provider]?.map((model) => (
                  <button key={model} disabled={/* ... logic */} >
                    {model}
                  </button>
                ))}
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <button onClick={() => setIsOpen(false)}>Done</button>
        </div>
      )}
    </div>
  );
}
```




