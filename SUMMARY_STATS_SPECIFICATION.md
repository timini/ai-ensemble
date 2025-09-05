# Summary Stats Bar Component Specification

This document outlines the complete technical and visual specification for the summary stats bar component, as seen in the provided screenshot.

## 1. Visual Design & Layout

- **Container**: A dark gray, rounded rectangle that spans the width of its parent.
  - `bg-gray-800`
  - `rounded-lg`
  - `p-4` (16px padding)
- **Layout**: A 4-column grid with centered text in each column.
  - `grid grid-cols-2 md:grid-cols-4` (Responsive: 2 columns on small screens, 4 on medium and up)
  - `gap-4` (16px gap between columns)
  - `text-center`

### Stat Items (All 4 columns)
Each of the four items in the bar consists of a large, colored number (or text) on top and a small, gray label below.

- **Statistic Value (Top)**:
  - `text-lg` (1.125rem font size)
  - `font-bold`
- **Label (Bottom)**:
  - `text-xs` (0.75rem font size)
  - `text-gray-400`

### Color Scheme for Stat Values
- **Models**: Blue (`text-blue-400`)
- **Providers**: Green (`text-green-400`)
- **Comparisons**: Purple (`text-purple-400`)
- **Status**: Orange (`text-orange-400`)

## 2. Data & Logic

This component's display is derived from the `selectedModels` array.

### Props Interface
The component relies on the `selectedModels` prop from its parent (`SelectedModelsDisplay`).

```typescript
interface SummaryStatsBarProps {
  selectedModels: SelectedModel[];
}

// The SelectedModel interface is defined in ModelSelection.tsx
interface SelectedModel {
  id: string;
  name: string;
  provider: 'openai' | 'google' | 'anthropic' | 'grok';
  model: string;
  isManual?: boolean;
  manualResponse?: string;
}
```

### Calculations

1.  **Models**: The total number of selected models.
    - **Logic**: `selectedModels.length`
    - **Example**: If there are 2 models in the array, it displays "2".

2.  **Providers**: The number of unique providers among the selected models.
    - **Logic**: `new Set(selectedModels.map(m => m.provider)).size`
    - **Example**: If `selectedModels` contains models from 'openai' and 'google', it displays "2". If it only contains 'openai' models, it displays "1".

3.  **Comparisons**: The number of unique pairs that can be formed from the selected models. This is calculated using the combination formula C(n, 2) = n * (n - 1) / 2.
    - **Logic**: `selectedModels.length >= 2 ? Math.floor((selectedModels.length * (selectedModels.length - 1)) / 2) : 0`
    - **Example**: With 2 models, it's 1 comparison. With 3 models, it's 3. With 4, it's 6.

4.  **Status**: Indicates whether the ensemble is ready for a query.
    - **Logic**: `selectedModels.length >= 2 ? 'Ready' : 'Waiting'`
    - **Business Rule**: The system requires at least 2 models to be selected to run a comparison.

## 3. Component Structure (React/JSX)

```jsx
import type { SelectedModel } from './ModelSelection'; // Adjust path as needed

interface SummaryStatsBarProps {
  selectedModels: SelectedModel[];
}

export function SummaryStatsBar({ selectedModels }: SummaryStatsBarProps) {
  const modelCount = selectedModels.length;
  const providerCount = new Set(selectedModels.map(m => m.provider)).size;
  const comparisonCount = modelCount >= 2 ? Math.floor((modelCount * (modelCount - 1)) / 2) : 0;
  const status = modelCount >= 2 ? 'Ready' : 'Waiting';

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {/* Models */}
        <div>
          <div className="text-lg font-bold text-blue-400">{modelCount}</div>
          <div className="text-xs text-gray-400">Models</div>
        </div>

        {/* Providers */}
        <div>
          <div className="text-lg font-bold text-green-400">{providerCount}</div>
          <div className="text-xs text-gray-400">Providers</div>
        </div>

        {/* Comparisons */}
        <div>
          <div className="text-lg font-bold text-purple-400">{comparisonCount}</div>
          <div className="text-xs text-gray-400">Comparisons</div>
        </div>

        {/* Status */}
        <div>
          <div className="text-lg font-bold text-orange-400">{status}</div>
          <div className="text-xs text-gray-400">Status</div>
        </div>
      </div>
    </div>
  );
}
```

## 4. Accessibility
- The component is purely informational, so it doesn't have interactive elements.
- The use of color is supplementary to the text, so it's accessible to users with color blindness.
- Standard semantic HTML is used.

This specification provides all the necessary details to build the summary stats bar component from scratch, ensuring it matches the existing design and functionality perfectly.





