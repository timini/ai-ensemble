# Summarizer Model Dropdown Specification

This document provides a complete technical specification for the "Summarizer Model" dropdown component, as seen in the screenshot.

## 1. Overview & Purpose

The Summarizer Model dropdown is a standard HTML `<select>` element that allows users to choose one of their already selected AI models to act as the "summarizer." The summarizer's role is to generate the final "Consensus Response" based on the outputs of all the other selected models.

## 2. Visual Design & Layout

### 2.1. Label
- **Text**: "Summarizer Model".
- **Styling**: A standard block label positioned above the dropdown.
  - `block`, `text-sm`, `font-medium`, `text-gray-300`, `mb-2`.

### 2.2. Dropdown (`<select>` element)
- **Appearance**: A dark-themed, full-width dropdown with a native chevron icon.
  - `w-full`, `bg-gray-800`, `border`, `border-gray-600`, `rounded-lg`, `px-4`, `py-2`, `text-white`.
- **Focus State**: The border color changes to blue when the element is focused.
  - `focus:border-blue-500`, `focus:outline-none`.
- **Options (`<option>` elements)**:
  - Rendered with the `model.name` property.
  - The native browser UI is used for the option list.

## 3. Data & Logic

The component is part of a larger form and its state is managed by the parent (`ImprovedEnsembleInterface`).

### 3.1. Props Interface

While it's not a separate component in the current implementation, if it were, its props would be:

```typescript
interface SummarizerSelectionProps {
  // The unique ID of the currently selected summarizer model
  selectedSummarizer: string;
  
  // A callback function to update the selected summarizer in the parent's state
  onSummarizerChange: (modelId: string) => void;

  // The list of all models the user has chosen for the ensemble
  // This list is used to populate the dropdown options.
  selectedModels: SelectedModel[];
}

// Assumes the SelectedModel interface is available
interface SelectedModel {
  id: string;
  name: string;
  provider: Provider;
  model: string;
  isManual?: boolean;
}
```

### 3.2. Data Flow & Behavior
- **Visibility**: The entire component (label and dropdown) only appears if `selectedModels.length > 0`.
- **Populating Options**: The dropdown is populated by mapping over the `selectedModels` array passed from the parent.
  - Each `<option>` `value` is set to the `model.id`.
  - The text content of each `<option>` is the `model.name`.
- **Default Option**: A disabled "Select summarizer..." option is the first in the list.
- **State Management**:
  - The `value` of the `<select>` element is bound to the `selectedSummarizer` state variable from the parent.
  - The `onChange` event handler calls the `setSelectedSummarizer` state setter from the parent.
- **Business Logic**:
  - **Manual Model Restriction**: The `onChange` handler checks if the newly chosen model has `isManual: true`. If so, it shows an `alert()` to the user and prevents the state from updating, as a manual response cannot be used to summarize API outputs.
  - **Persistence**: The parent component (`ImprovedEnsembleInterface`) saves the `selectedSummarizer` ID to `localStorage` so the choice is remembered across sessions.

## 4. Component Structure (React/JSX)

This is the exact implementation found within `ImprovedEnsembleInterface.tsx`.

```jsx
{/* Rendered only when at least one model has been selected */}
{selectedModels.length > 0 && (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      Summarizer Model
    </label>
    <select
      value={selectedSummarizer}
      onChange={(e) => {
        const chosenId = e.target.value;
        const chosenModel = selectedModels.find(m => m.id === chosenId);
        
        // Prevent manual models from being selected as summarizers
        if (chosenModel?.isManual) {
          alert('Manual models cannot be used as summarizer. Please select an API model.');
          return;
        }
        
        setSelectedSummarizer(chosenId);
      }}
      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
    >
      <option value="">Select summarizer...</option>
      {selectedModels.map(model => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  </div>
)}
```

## 5. Accessibility
- A `<label>` is correctly associated with the `<select>` element, although an explicit `htmlFor` could be added for stronger binding.
- As a native `<select>` element, it leverages the browser's built-in accessibility features for keyboard navigation and screen reader support.




