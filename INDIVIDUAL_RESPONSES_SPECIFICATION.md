# Individual Responses Section Specification

This document provides a complete technical specification for the "Individual Responses" UI component, as seen in the screenshot.

## 1. Overview & Purpose

This section is the primary output area of the application, displaying the generated content from each AI model selected by the user. It consists of a main header, a control button, and a grid of response cards. It only appears after a prompt has been submitted and the streaming process has begun.

## 2. Visual Design & Layout

### 2.1. Main Header
- **Layout**: A flex container with content spaced apart.
  - `flex`, `justify-between`, `items-center`, `mb-4`.
- **Title**: "Individual Responses".
  - `text-2xl`, `font-bold`.
- **"+ Add Manual Response" Button**:
  - `bg-blue-600`, `hover:bg-blue-700`, `text-white`, `font-bold`, `py-2`, `px-4`, `rounded-lg`.

### 2.2. Response Card Grid
- **Layout**: A responsive grid that shows one column on small screens and two on medium screens and up.
  - `grid`, `grid-cols-1`, `md:grid-cols-2`, `gap-4`.

### 2.3. Individual Response Card
- **Container**: A dark gray, padded, rounded card for each model's response.
  - `bg-gray-800`, `p-4`, `rounded-lg`.
- **Card Header**:
  - **Layout**: `flex`, `items-center`, `gap-2`, `mb-3`.
  - **Provider Dot**: `w-3`, `h-3`, `rounded-full`. Color is dynamically set via `getProviderColor(model.provider)`.
  - **Model Name & Status**:
    - `font-bold`. Color is dynamic based on stream state (e.g., green `text-green-400` for 'complete').
    - The model name (`model.name`) is followed by a status icon (`✅` for 'complete').
  - **Copy Button**:
    - A `CopyButton` component is rendered to the right of the title. It's only visible when the model's stream state is `'complete'`.
- **Card Body (Response Text)**:
  - **Container**: Styled for markdown rendering.
    - `prose`, `prose-sm`, `prose-invert`, `max-w-none`.
  - **Content**: The response text is rendered using `ReactMarkdown`, which supports GitHub Flavored Markdown (GFM).
  - **Streaming Indicator**: A pulsing caret `▋` (`animate-pulse`) is shown while the response is actively streaming.

## 3. Data Structures

This component's rendering is primarily driven by the `selectedModels` array and the `streamingData` state object from the `ImprovedEnsembleInterface` parent.

### 3.1. Props Interface
If this were a standalone component, its props would be:

```typescript
interface IndividualResponsesProps {
  // Array of models chosen by the user
  selectedModels: SelectedModel[];

  // Real-time data object for the streaming process
  streamingData: StreamingData;

  // State flag for the overall streaming process
  isStreaming: boolean;
  
  // Callback to open the manual response modal
  onAddManualResponse: () => void;
}
```

### 3.2. Core Data Structures

```typescript
// From ModelSelection.tsx
interface SelectedModel {
  id: string;
  name: string;
  provider: Provider;
  model: string;
  isManual?: boolean;
}

// State within ImprovedEnsembleInterface.tsx
interface StreamingData {
  // Maps a model's unique ID to its full response string
  modelResponses: Record<string, string>;

  // Maps a model's unique ID to its current streaming status
  modelStates: Record<string, 'pending' | 'streaming' | 'complete' | 'error'>;
  
  // ... other streaming data properties
}
```

## 4. Behavior & Logic

- **Visibility**: The entire section is only rendered when `isStreaming` is `true` or the consensus state is `'complete'`.
- **"+ Add Manual Response" Button Visibility**: This button is only shown when *all* selected models have completed their responses (`selectedModels.every(...)`) or when streaming is not active. This prevents adding a manual response mid-stream.
- **Card Rendering**: The component maps over the `selectedModels` array to create a response card for each selected model. It does not map over `streamingData.modelResponses`, ensuring a card exists for every model, even before it has started generating a response.
- **Dynamic Content**:
  - The title of each card uses `getStateColor()` and `getStateIcon()` helper functions to dynamically display the color and emoji based on the model's status in `streamingData.modelStates`.
  - The response text is pulled from `streamingData.modelResponses[model.id]`.
  - If a response is empty, it displays placeholder text like "Waiting to start..." or "Generating response..." based on the model's state.

## 5. Component Structure (React/JSX)

This is the exact implementation from `ImprovedEnsembleInterface.tsx`.

```jsx
<div>
  {/* Header */}
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold">Individual Responses</h2>
    {(selectedModels.every(model => streamingData.modelStates[model.id] === 'complete') || !isStreaming) && (
      <button
        onClick={() => setIsManualResponseModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
      >
        + Add Manual Response
      </button>
    )}
  </div>

  {/* Grid of Response Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {selectedModels.map(model => (
      <div key={model.id} className="bg-gray-800 p-4 rounded-lg">
        {/* Card Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getProviderColor(model.provider) }}
          />
          <h3 className={`font-bold ${getStateColor(streamingData.modelStates[model.id] ?? 'pending')}`}>
            {model.name} {getStateIcon(streamingData.modelStates[model.id] ?? 'pending')}
          </h3>
          {streamingData.modelStates[model.id] === 'complete' && (
            <CopyButton textToCopy={streamingData.modelResponses[model.id] ?? ''} />
          )}
        </div>
        
        {/* Card Body with Markdown Response */}
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {streamingData.modelResponses[model.id] ?? 
             (streamingData.modelStates[model.id] === 'streaming' ? ' ' : 'Waiting to start...')}
          </ReactMarkdown>
          {streamingData.modelStates[model.id] === 'streaming' && (
            <span className="animate-pulse">▋</span>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
```




