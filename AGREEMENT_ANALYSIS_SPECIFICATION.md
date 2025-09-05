# Agreement Analysis Component Specification

This document provides a complete technical specification for the `ConsensusDiagram` component, as seen in the "Agreement Analysis" section of the screenshot. Due to its complexity, this specification includes the full source code and detailed explanations of its implementation.

## 1. Overview & Purpose

The `ConsensusDiagram` is a data visualization component designed to show the semantic similarity (or "agreement") between the responses of multiple AI models. It renders a network-style diagram where models are nodes and the lines between them represent the agreement score. It also includes a legend for the scores and a color-coded scale for easy interpretation.

## 2. Component Implementation (Full Code)

The component is self-contained in `src/app/_components/ConsensusDiagram.tsx`. It is implemented using a combination of React, SVG for the diagram itself, and styled divs for the nodes and legends. It **does not** use an external charting library like D3.

```tsx
// src/app/_components/ConsensusDiagram.tsx

"use client";

import { getProviderColor } from "@/types/modelConfig";
import type { AgreementScore } from "@/types/agreement";
import type { SelectedModel } from "./ModelSelection";

interface ConsensusDiagramProps {
  scores: AgreementScore[];
  models: SelectedModel[];
}

const DIAGRAM_SIZE = 200;
const CENTER = DIAGRAM_SIZE / 2;
const RADIUS = DIAGRAM_SIZE / 2 - 20; // Radius for placing model nodes

export function ConsensusDiagram({ scores, models }: ConsensusDiagramProps) {
  if (models.length < 2) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400 h-[200px] flex items-center justify-center">
        Select at least 2 models for agreement analysis.
      </div>
    );
  }

  // Calculate node positions on the circle
  const angleStep = (2 * Math.PI) / models.length;
  const modelPositions = models.map((model, index) => {
    const angle = angleStep * index - Math.PI / 2; // Start from top
    return {
      ...model,
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  });

  const positionMap = new Map<string, { x: number; y: number }>(modelPositions.map(m => [m.id, { x: m.x, y: m.y }]));
  const nameMap = new Map<string, string>(models.map(m => [m.id, m.name]));

  const getScoreColor = (score: number) => {
    const percentage = score * 100;
    if (percentage < 25) return "text-red-500";
    if (percentage < 50) return "text-orange-500";
    if (percentage < 75) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
      {/* SVG and Node Container */}
      <div className="relative" style={{ width: DIAGRAM_SIZE, height: DIAGRAM_SIZE, margin: '0 auto' }}>
        <svg width={DIAGRAM_SIZE} height={DIAGRAM_SIZE} viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`}>
          {/* Render lines and labels for scores */}
          {scores.map(({ id1, id2, score }, index) => {
            const pos1 = positionMap.get(id1);
            const pos2 = positionMap.get(id2);
            if (!pos1 || !pos2) return null;

            const opacity = Math.max(0.3, score);
            const strokeWidth = Math.max(2, 1 + score * 4); // Minimum 2px, max 5px
            const lineLabel = String.fromCharCode(65 + index); // A, B, C...

            return (
              <g key={`${id1}-${id2}`}>
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  className="stroke-gray-500"
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                />
                <text
                  x={(pos1.x + pos2.x) / 2}
                  y={(pos1.y + pos2.y) / 2}
                  dy=".35em"
                  textAnchor="middle"
                  className="fill-current text-white text-[10px] font-bold"
                  style={{ paintOrder: 'stroke', stroke: '#1f2937', strokeWidth: '3px', strokeLinejoin: 'round' }}
                >
                  {lineLabel}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* Render model nodes and labels */}
        {modelPositions.map(model => (
          <div
            key={model.id}
            className="absolute flex flex-col items-center text-center"
            style={{
              left: `${model.x}px`,
              top: `${model.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '80px', // Fixed width for labels
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-gray-900"
              style={{ backgroundColor: getProviderColor(model.provider) }}
            />
            <span className="text-xs mt-1 text-gray-300 truncate w-full">
              {model.name}
            </span>
          </div>
        ))}
      </div>

      {/* Agreement Score Key */}
      <div className="text-xs text-center text-gray-200 mt-4 grid grid-cols-1 gap-1 w-full" data-testid="agreement-scores">
        {scores.map(({ id1, id2, score }, index) => (
          <div key={`${id1}-${id2}`} data-testid="agreement-score">
            <span className="font-bold text-gray-100">{String.fromCharCode(65 + index)}:</span>
            {' '}
            <span className="font-semibold text-gray-300">{nameMap.get(id1)?.split(' ').pop() ?? 'Unknown'}</span>
            {' <> '}
            <span className="font-semibold text-gray-300">{nameMap.get(id2)?.split(' ').pop() ?? 'Unknown'}</span>
            {': '}
            <span className={`${getScoreColor(score)} font-semibold`}>{(score * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {/* Agreement Scale Key */}
      <div className="w-full mt-4">
        <h4 className="text-sm font-bold mb-2 text-center">Agreement Scale</h4>
        <div className="flex justify-between text-xs px-2">
          <span className="text-red-500">Low</span>
          <span className="text-orange-500">Medium</span>
          <span className="text-yellow-500">High</span>
          <span className="text-green-500">Very High</span>
        </div>
        <div className="w-full h-2 flex mt-1 rounded-full overflow-hidden">
          <div className="w-1/4 bg-red-500"></div>
          <div className="w-1/4 bg-orange-500"></div>
          <div className="w-1/4 bg-yellow-500"></div>
          <div className="w-1/4 bg-green-500"></div>
        </div>
      </div>
    </div>
  );
}
```

## 3. Data Structures

The component requires two key props: `scores` and `models`.

### 3.1. Props Interface
```typescript
interface ConsensusDiagramProps {
  scores: AgreementScore[];
  models: SelectedModel[];
}
```

### 3.2. Core Data Types
These types define the shape of the data that drives the visualization.

```typescript
// src/types/agreement.ts
export type AgreementScore = {
  id1: string;     // The unique ID of the first model in the pair
  id2: string;     // The unique ID of the second model in the pair
  score: number;   // A value from 0.0 to 1.0 representing similarity
};

// src/app/_components/ModelSelection.tsx
export interface SelectedModel {
  id: string;      // Must match the IDs used in AgreementScore
  name: string;
  provider: Provider;
  model: string;
}
```

## 4. Implementation Details & Logic

### 4.1. Diagram Layout
- **Circular Node Placement**: The core of the layout logic is in the `modelPositions` calculation. It arranges the models (nodes) evenly in a circle.
  - It calculates the angle for each model (`angleStep`).
  - It uses trigonometry (`Math.cos` and `Math.sin`) to convert the angle and a fixed `RADIUS` into `(x, y)` coordinates.
  - The `- Math.PI / 2` offset ensures the first model starts at the top of the circle.
- **SVG and HTML Hybrid**: The component uses a clever layering technique:
  1.  An `<svg>` element is used to draw the gray lines (`<line>`) and their letter labels (`<text>`) between the model nodes. This is ideal for connecting arbitrary points.
  2.  The model nodes themselves (the colored dots and text labels) are standard `<div>` elements with `position: absolute`. They are placed on top of the SVG using the calculated `(x, y)` coordinates. This makes styling them with Tailwind CSS much easier than using SVG shapes.

### 4.2. Line Styling
- The thickness (`strokeWidth`) and transparency (`opacity`) of each line are directly proportional to the `score`.
  - `opacity = Math.max(0.3, score)` ensures lines are never fully transparent.
  - `strokeWidth = Math.max(2, 1 + score * 4)` makes higher-agreement lines thicker.

### 4.3. Score & Scale Legend
- **Score Legend**: This section maps over the `scores` array and generates a text line for each agreement pair (e.g., "A: gpt-4o-mini <> test: 36%").
  - The letter label (`A`, `B`, `C`...) is generated using `String.fromCharCode(65 + index)`.
  - The model names are pulled from a `nameMap` for efficiency.
  - The percentage color is determined by the `getScoreColor` helper function.
- **Agreement Scale**: This is a static visual element composed of four colored `<div>`s, each taking up `w-1/4` of the container's width, to create the gradient bar.

## 5. Parent Component Integration

The `ConsensusDiagram` is rendered within `ImprovedEnsembleInterface.tsx` and is passed the necessary data from the parent's state.

```jsx
// src/app/_components/ImprovedEnsembleInterface.tsx

// ... inside the return statement ...

<div className="md:col-span-1">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-2xl font-bold border-b-2 border-gray-600 pb-2">
      Agreement Analysis {getStateIcon(streamingData.agreementState)}
    </h2>
    {/* ... Copy Button ... */}
  </div>
  {(isStreaming || streamingData.consensusState === 'complete') ? (
    <ConsensusDiagram 
      scores={streamingData.agreementScores} 
      models={selectedModels} 
    />
  ) : (
    {/* ... Placeholder content ... */}
  )}
</div>
```
The `scores` and `models` are passed directly from the `streamingData` and `selectedModels` state variables.




