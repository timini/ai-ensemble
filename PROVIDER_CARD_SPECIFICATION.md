# AI Provider Card Component Specification

This document provides a complete technical specification for the individual AI Provider Card component, as seen in the screenshot showing the "OpenAI" provider in a valid state.

## 1. Overview & Purpose

The Provider Card is a self-contained unit within the "AI Provider Configuration" popover. It displays the provider's information, an input field for the API key, validation status, and controls to manage the key. This specification focuses on a single card.

## 2. Visual Design & Layout

- **Container**: A padded, rounded, and bordered card.
  - `p-4`, `rounded-lg`, `border`, `border-gray-600`, `bg-gray-700`.

### 2.1. Card Header
- **Layout**: A flexbox container with items aligned and space between them.
  - `flex`, `items-center`, `justify-between`, `mb-3`.

- **Left Side (Provider Info)**:
  - **Layout**: `flex`, `items-center`, `gap-3`.
  - **Colored Dot**: A circular indicator for the provider.
    - `w-4`, `h-4`, `rounded-full`.
    - `backgroundColor` is dynamically set (e.g., green `hsl(140, 70%, 60%)` for OpenAI).
  - **Text Group**:
    - **Provider Name** ("OpenAI"): `font-medium`, `text-white`.
    - **Description** ("GPT models..."): `text-xs`, `text-gray-400`.

- **Right Side (Status Icon)**:
  - **Icon**: An emoji representing the validation status.
    - `✅` for 'valid' status.
  - **Styling**: `text-sm` with dynamic color.
    - `text-green-400` for 'valid' status.

### 2.2. Card Body
- **Layout**: A container for the input and status message.
  - `space-y-2`.

- **API Key Input Group**:
  - **Layout**: `flex`, `gap-2`.
  - **Input Field**: A password-type input for the API key.
    - `type="password"` (can be toggled to "text").
    - **Styling**: `flex-1`, `bg-gray-800`, `border`, `border-gray-600`, `rounded`, `px-3`, `py-2`, `text-sm`, `text-white`.
  - **Toggle Visibility Button**: A button to show/hide the API key.
    - **Styling**: `px-3`, `py-2`, `bg-gray-600`, `hover:bg-gray-500`, `rounded`, `text-sm`.
    - **Icon**: `🙈` emoji when the key is hidden.

### 2.3. Status Message
- **Layout**: A flex container for the icon and text.
- **Icon**: `✅` emoji.
- **Text** ("48 models available"):
  - **Styling**: `text-xs`, `text-green-400`.
- **Visibility**: This message is only shown when the provider's API key has been successfully validated.

## 3. Data & Props

This component would be a child of `ProviderConfiguration` and would receive props for a single provider.

### 3.1. Props Interface

```typescript
type Provider = 'openai' | 'google' | 'anthropic' | 'grok';
type ProviderStatus = 'valid' | 'invalid' | 'unchecked' | 'validating';

interface ProviderCardProps {
  provider: Provider;
  
  // Static display information
  info: {
    name: string;
    description: string;
    keyPlaceholder: string;
  };

  // State from parent
  apiKey: string;
  status: ProviderStatus;
  isKeyVisible: boolean;
  availableModelCount: number;

  // Callbacks to parent
  onApiKeyChange: (provider: Provider, key: string) => void;
  onToggleVisibility: (provider: Provider) => void;
}
```

### 3.2. Data Dependencies
- `getProviderColor(provider)`: A utility function that returns a specific HSL color string for each provider.
- `PROVIDER_INFO`: A constant object holding the name, description, and placeholder for each provider, which would be passed into the `info` prop.

## 4. States & Behavior

The card's appearance changes based on the `status` and `isKeyVisible` props. This specification details the "Valid" state shown in the screenshot.

### 4.1. "Valid" State (As Pictured)
- **Condition**: The `status` prop is `'valid'`.
- **Header Icon**: Displays a green `✅` (`text-green-400`).
- **Status Message**: Displays `✅ {availableModelCount} models available` in green text (`text-green-400`).

### 4.2. Other States (Not Pictured)
- **Unchecked**: Header icon is `⏳` in gray. No status message.
- **Validating**: Header icon is `🔄` in blue. Status message is `🔄 Validating API key...` in blue.
- **Invalid**: Header icon is `❌` in red. Status message is `❌ Invalid API key` in red.

### 4.3. Interactions
- **Typing in Input**: Calls the `onApiKeyChange` callback, passing the provider and the new key value. This would trigger a debounced validation in the parent component.
- **Clicking Toggle Button**: Calls the `onToggleVisibility` callback, passing the provider. This updates the `isKeyVisible` state in the parent, which flows back down as a prop, causing the input type to change between `password` and `text` and the button emoji to toggle between `🙈` and `👁️`.

## 5. Component Structure (React/JSX)

```jsx
// A self-contained ProviderCard component
export function ProviderCard({
  provider,
  info,
  apiKey,
  status,
  isKeyVisible,
  availableModelCount,
  onApiKeyChange,
  onToggleVisibility,
}) {
  const statusIcon = getStatusIcon(status); // Helper function to return emoji
  const statusColor = getStatusColor(status); // Helper function to return Tailwind class
  const providerColor = getProviderColor(provider);

  return (
    <div className="p-4 rounded-lg border border-gray-600 bg-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: providerColor }} />
          <div>
            <div className="font-medium text-white">{info.name}</div>
            <div className="text-xs text-gray-400">{info.description}</div>
          </div>
        </div>
        <div className={`text-sm ${statusColor}`}>{statusIcon}</div>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type={isKeyVisible ? 'text' : 'password'}
            placeholder={info.keyPlaceholder}
            value={apiKey}
            onChange={(e) => onApiKeyChange(provider, e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => onToggleVisibility(provider)}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
            title={isKeyVisible ? 'Hide key' : 'Show key'}
          >
            {isKeyVisible ? '👁️' : '🙈'}
          </button>
        </div>

        {/* Status Message */}
        {status === 'valid' && (
          <div className="text-xs text-green-400">
            ✅ {availableModelCount} models available
          </div>
        )}
        {status === 'invalid' && (
          <div className="text-xs text-red-400">❌ Invalid API key</div>
        )}
        {status === 'validating' && (
           <div className="text-xs text-blue-400">🔄 Validating API key...</div>
        )}
      </div>
    </div>
  );
}
```





