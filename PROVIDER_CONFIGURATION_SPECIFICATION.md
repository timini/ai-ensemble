# AI Provider Configuration Component Specification

This document provides a complete technical specification for the `ProviderConfiguration` component, as seen in the screenshot.

## 1. Overview & Placement

The `ProviderConfiguration` component is a dropdown/popover menu that allows users to input, manage, and validate API keys for various AI providers (OpenAI, Google, Anthropic, Grok). It is triggered by a button that shows the count of currently configured providers.

## 2. Visual Design & Layout

### 2.1. Trigger Button
- **Appearance**: A gray button with a wrench icon, text, and a dropdown arrow.
  - `bg-gray-700`, `hover:bg-gray-600`, `rounded-lg`, `px-4`, `py-2`.
- **Text**: "Configure Providers (X/4)", where X is the number of providers with a non-empty API key.
- **Iconography**:
  - Wrench `<span>🔧</span>` on the left.
  - Arrow `<span>▼</span>` on the right, which rotates 180 degrees when the menu is open.

### 2.2. Popover Container
- **Appearance**: A dark gray, bordered, rounded-lg popover that appears below the trigger button.
  - `absolute`, `bg-gray-800`, `border`, `border-gray-600`, `rounded-lg`, `shadow-lg`, `z-50`, `p-4`.
- **Header**:
  - Title: "AI Provider Configuration" (`text-lg font-bold text-white`).
  - Description: "Configure API keys..." (`text-sm text-gray-400`).
- **Footer**:
  - Displays "Configured: X/4 providers" on the left.
  - A "Done" button on the right to close the popover.

### 2.3. Provider Card (Repeated for each provider)
Each provider is displayed in its own card within the popover.

- **Container**:
  - `p-4`, `rounded-lg`, `border`, `border-gray-600`, `bg-gray-700`.
- **Card Header**:
  - **Layout**: `flex items-center justify-between`.
  - **Left Side**:
    - Colored Dot: `w-4 h-4 rounded-full`. Color is specific to the provider (see `getProviderColor`).
    - Provider Name: `font-medium text-white`.
    - Provider Description: `text-xs text-gray-400`.
  - **Right Side**: Status Icon (see section 4).
- **Card Body**:
  - **API Key Input**: `flex gap-2`.
    - `input`: `type="password"` by default, changes to `text` when visible.
      - `flex-1`, `bg-gray-800`, `border`, `border-gray-600`, `rounded`, `px-3`, `py-2`, `text-sm`.
    - **Toggle Visibility Button**:
      - `px-3 py-2`, `bg-gray-600`, `hover:bg-gray-500`, `rounded`.
      - Shows `🙈` (monkey) emoji when hidden, `👁️` (eye) when visible.
  - **Status Message**: A small text area below the input that displays validation status.
    - `text-xs`.
    - Color and text change based on status (see section 4).

## 3. Data Structures

### 3.1. Props Interface

```typescript
interface ProviderConfigurationProps {
  // Currently entered API keys
  providerKeys: Record<Provider, string>;
  onProviderKeysChange: (keys: Record<Provider, string>) => void;

  // Validation status for each provider
  providerStatus: Record<Provider, 'valid' | 'invalid' | 'unchecked'>;
  onProviderStatusChange: (status: Record<Provider, 'valid' | 'invalid' | 'unchecked'>) => void;

  // List of available model names after successful validation
  availableModels: Record<Provider, string[]>;
  onAvailableModelsChange: (models: Record<Provider, string[]>) => void;
  
  // A boolean flag to trigger the initial validation on component mount
  triggerInitialValidation: boolean;
}

type Provider = 'openai' | 'google' | 'anthropic' | 'grok';
```

### 3.2. Static Provider Info
The component contains a constant `PROVIDER_INFO` that holds the display name, description, and input placeholder for each provider.

```typescript
const PROVIDER_INFO = {
  openai: { name: 'OpenAI', description: '...', keyPlaceholder: 'sk-...' },
  google: { name: 'Google', description: '...', keyPlaceholder: 'Your Google AI API key' },
  // ... and so on for anthropic, grok
} as const;
```

## 4. State Management & Behavior

### 4.1. Internal State
-   `isOpen: boolean`: Controls the visibility of the popover.
-   `visibleKeys: Set<Provider>`: Tracks which API keys are currently visible (toggled by the 🙈/👁️ button).
-   `validatingKeys: Set<Provider>`: Tracks which providers are currently undergoing async validation.

### 4.2. API Key Handling
-   **Persistence**: Keys are loaded from and saved to `localStorage` on mount and on change, respectively.
-   **Input Change**: When a user types in the input field, the `onProviderKeysChange` callback is invoked.
-   **Debouncing**: API validation is debounced by **1000ms**. A `setTimeout` is created when the user types, and it's cleared if the user types again within the delay. This prevents sending a request for every keystroke.

### 4.3. Validation Flow & Status Display
Validation is a multi-step async process that determines the display of the status icon and message.

| State           | Icon | Icon Color    | Message Text                       | Message Color  | Trigger                                                |
| --------------- | ---- | ------------- | ---------------------------------- | -------------- | ------------------------------------------------------ |
| **Unchecked**   | `⏳` | `text-gray-400` | (No message)                       | -              | Initial state or API key is empty.                     |
| **Validating**  | `🔄` | `text-blue-400` | `🔄 Validating API key...`         | `text-blue-400`  | Async validation is in progress (`validatingKeys` set). |
| **Valid**       | `✅` | `text-green-400`| `✅ X models available`            | `text-green-400` | API key is valid and model list has been fetched.      |
| **Invalid**     | `❌` | `text-red-400`  | `❌ Invalid API key`               | `text-red-400`   | API validation failed.                                 |

-   **Initial Validation**: When the component mounts and `triggerInitialValidation` is true, it automatically validates any keys loaded from `localStorage`.
-   **Async Calls**: The component uses `tRPC` mutations (`validateApiKey` and `getModels`) to perform server-side validation.

## 5. Component Structure (React/JSX Snippet)

```jsx
// Simplified structure
export function ProviderConfiguration({ ...props }) {
  // ... hooks for state, effects, and callbacks

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button onClick={() => setIsOpen(!isOpen)}>
        <span>🔧</span>
        <span>Configure Providers ({configuredProviders.length}/4)</span>
        {/* ... arrow icon */}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute ...">
          <h3>AI Provider Configuration</h3>
          <p>Configure API keys...</p>

          <div className="space-y-4">
            {(Object.keys(PROVIDER_INFO) as Provider[]).map((provider) => (
              <div key={provider} className="p-4 rounded-lg ...">
                {/* Provider Card Header */}
                <div className="flex items-center justify-between mb-3">
                  {/* ... colored dot, name, description */}
                  <div className={`text-sm ${getStatusColor(provider)}`}>
                    {getStatusIcon(provider)}
                  </div>
                </div>

                {/* Provider Card Body */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type={visibleKeys.has(provider) ? "text" : "password"}
                      value={providerKeys[provider]}
                      onChange={(e) => updateProviderKey(provider, e.target.value)}
                      // ... other props
                    />
                    <button onClick={() => toggleKeyVisibility(provider)}>
                      {visibleKeys.has(provider) ? "👁️" : "🙈"}
                    </button>
                  </div>
                  {/* Conditional Status Messages */}
                  {/* ... e.g., "Validating...", "✅ X models available", etc. */}
                </div>
              </div>
            ))}
          </div>
          {/* Footer with Done button */}
        </div>
      )}
    </div>
  );
}
```





