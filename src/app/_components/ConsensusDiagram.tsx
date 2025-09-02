"use client";

import { getProviderColor } from "~/types/modelConfig";
import type { AgreementScore } from "~/types/agreement";
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

  const positionMap = new Map(modelPositions.map(m => [m.id, { x: m.x, y: m.y }]));
  const nameMap = new Map(models.map(m => [m.id, m.name]));

  const getScoreColor = (score: number) => {
    const percentage = score * 100;
    if (percentage < 25) return "text-red-500";
    if (percentage < 50) return "text-orange-500";
    if (percentage < 75) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
      <div className="relative" style={{ width: DIAGRAM_SIZE, height: DIAGRAM_SIZE, margin: '0 auto' }}>
        <svg width={DIAGRAM_SIZE} height={DIAGRAM_SIZE} viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`}>
          {/* Render lines and labels for scores */}
          {scores.map(({ id1, id2, score }, index) => {
            const pos1 = positionMap.get(id1);
            const pos2 = positionMap.get(id2);
            if (!pos1 || !pos2) return null;

            const opacity = Math.max(0.1, score);
            const strokeWidth = 1 + score * 3;
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
      <div className="text-xs text-center text-gray-200 mt-4 grid grid-cols-1 gap-1 w-full">
        {scores.map(({ id1, id2, score }, index) => (
          <div key={`${id1}-${id2}`}>
            <span className="font-bold text-gray-100">{String.fromCharCode(65 + index)}:</span>
            {' '}
            <span className="font-semibold text-gray-300">{nameMap.get(id1)?.split(' ').pop()}</span>
            {' <> '}
            <span className="font-semibold text-gray-300">{nameMap.get(id2)?.split(' ').pop()}</span>
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
