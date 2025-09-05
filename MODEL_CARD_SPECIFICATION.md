# Model Card Component Specification

## Overview
This specification describes the model card component as shown in the screenshot. This is an individual card that displays a selected AI model with its status, provider information, and management controls.

## Visual Design

### Card Structure
- **Container**: Dark gray rounded card (`bg-gray-800`) with subtle border (`border-gray-600`)
- **Padding**: 16px (`p-4`) for comfortable content spacing
- **Hover State**: Border lightens to `border-gray-500` with smooth transition
- **Responsive**: Works in grid layouts (1-4 columns depending on screen size)

### Header Section (Top)
**Left Side:**
- **Provider Indicator**: Small circular dot (12px diameter, `w-3 h-3`) 
  - Color based on provider: `getProviderColor(provider)`
  - OpenAI: Green `hsl(140, 70%, 60%)`
  - Google: Blue `hsl(220, 90%, 60%)`
  - Anthropic: Orange `hsl(30, 80%, 60%)`
  - Grok: Purple `hsl(280, 70%, 60%)`
- **Model Number**: Gray text `#1`, `#2`, etc. (`text-xs font-medium text-gray-400`)
- **Manual Badge** (optional): Blue badge with "Manual" text if `isManual` is true

**Right Side:**
- **Status Indicator**: Shows validation or streaming state
  - Valid: ✅ green (`text-green-400`)
  - Invalid: ❌ red (`text-red-400`) 
  - Pending: ⏳ yellow (`text-yellow-400`)
  - During streaming: 🔄 (spinning), ✅ (complete), ❌ (error)
- **Remove Button**: × symbol, only visible on hover when >2 models selected
  - Red color (`text-red-400 hover:text-red-300`)
  - Only appears when `selectedModels.length > 2`

### Content Section (Main)
**Model Name**: Primary white text, medium font weight
- Example: "Openai gpt-4o-mini"
- Format: `{provider.capitalized} {model}`

**Model ID**: Secondary gray text, smaller font
- Example: "gpt-4o-mini" 
- Technical model identifier

**Provider Name**: Tertiary gray text, smallest font
- Example: "Openai"
- Capitalized provider name

**Manual Response Preview** (if applicable):
- Small gray box (`bg-gray-700`) with truncated response text
- Shows first 50 characters + "..." with full text in tooltip

## Data Structure

### SelectedModel Interface
```typescript
interface SelectedModel {
  id: string;           // Unique identifier
  name: string;         // Display name for the model
  provider: Provider;   // 'openai' | 'google' | 'anthropic' | 'grok'
  model: string;        // Technical model ID for API
  isManual?: boolean;   // Whether this is a manual response
  manualResponse?: string; // Manual response content if isManual
}
```

### Provider Type
```typescript
type Provider = 'openai' | 'google' | 'anthropic' | 'grok';
```

### StreamingData Interface
```typescript
interface StreamingData {
  modelStates: Record<string, 'pending' | 'streaming' | 'complete' | 'error'>;
  modelResponses?: Record<string, string>;
}
```

## Props Interface

```typescript
interface ModelCardProps {
  model: SelectedModel;
  index: number;                    // For numbering (#1, #2, etc.)
  validationResults?: Record<string, 'valid' | 'invalid' | 'pending'>;
  isStreaming: boolean;
  streamingData: StreamingData;
  onRemove: (modelId: string) => void;
  canRemove: boolean;               // true when selectedModels.length > 2
}
```

## Behavior & Interactions

### States
1. **Default State**: Normal display with validation status
2. **Hover State**: Shows remove button (if removable), lightens border
3. **Streaming State**: Shows streaming status instead of validation
4. **Error State**: Red status indicator with error icon

### Interactions
- **Hover**: Border color changes, remove button appears (if applicable)
- **Click Remove**: Calls `onRemove(model.id)` - only enabled when `canRemove` is true
- **Tooltip**: Manual response preview shows full text on hover

### Business Rules
- Minimum 2 models required (remove button disabled when count <= 2)
- Maximum 8 models allowed
- Each model must have unique ID
- Provider colors are consistent across the application

## Styling Classes

### Container
```css
bg-gray-800 border border-gray-600 rounded-lg p-4 
hover:border-gray-500 transition-colors relative group
```

### Header Layout
```css
flex items-start justify-between mb-3
```

### Provider Indicator
```css
w-3 h-3 rounded-full flex-shrink-0
```

### Status Icons
```css
text-sm text-green-400 | text-red-400 | text-yellow-400 | text-gray-400
```

### Remove Button
```css
opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 
text-sm transition-opacity
```

### Content Typography
- **Model Name**: `font-medium text-white text-sm leading-tight`
- **Model ID**: `text-xs text-gray-400 leading-tight`
- **Provider**: `text-xs text-gray-500`

## Example Usage

```tsx
<ModelCard
  model={{
    id: "openai-gpt4o-mini-1234",
    name: "Openai gpt-4o-mini", 
    provider: "openai",
    model: "gpt-4o-mini",
    isManual: false
  }}
  index={0}
  validationResults={{"openai-gpt4o-mini-1234": "valid"}}
  isStreaming={false}
  streamingData={{modelStates: {}}}
  onRemove={(id) => handleRemove(id)}
  canRemove={true}
/>
```

## Accessibility Considerations
- Remove button has proper `title` attribute for screen readers
- Color is not the only indicator of status (icons + colors)
- Focus states for interactive elements
- Proper semantic HTML structure

## Dependencies
- `getProviderColor()` utility function from `@/types/modelConfig`
- Provider color constants
- Tailwind CSS for styling
- React for component logic

This component is designed to be reusable and can be easily integrated into grid layouts while maintaining consistent visual hierarchy and interaction patterns.





