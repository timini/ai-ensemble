import { render, screen } from '@testing-library/react';
import { ConsensusDiagram } from './ConsensusDiagram';

describe('ConsensusDiagram', () => {
  const mockModels = [
    { id: 'model1', name: 'OpenAI GPT-4', provider: 'openai', model: 'gpt-4' },
    { id: 'model2', name: 'Anthropic Claude', provider: 'anthropic', model: 'claude-3' },
    { id: 'model3', name: 'Google Gemini', provider: 'google', model: 'gemini-pro' },
    { id: 'manual-1', name: 'Manual Response', provider: 'google', model: 'gem' },
  ] as any;

  it('renders nodes for all models including manual', () => {
    const scores = [
      { id1: 'model1', id2: 'manual-1', score: 0.7 },
    ];

    render(<ConsensusDiagram scores={scores} models={mockModels.slice(0, 2)} />);

    expect(screen.getByTestId('agreement-scores')).toBeInTheDocument();
  });

  it('displays message when fewer than 2 models are selected', () => {
    const scores: any[] = [];
    const singleModel = [mockModels[0]];

    render(<ConsensusDiagram scores={scores} models={singleModel} />);

    expect(screen.getByText('Select at least 2 models for agreement analysis.')).toBeInTheDocument();
  });

  it('renders lines with proper visual attributes for various agreement scores', () => {
    const scores = [
      { id1: 'model1', id2: 'model2', score: 0.1 }, // Low agreement - 10%
      { id1: 'model1', id2: 'model3', score: 0.5 }, // Medium agreement - 50%
      { id1: 'model2', id2: 'model3', score: 0.9 }, // High agreement - 90%
    ];

    const { container } = render(<ConsensusDiagram scores={scores} models={mockModels.slice(0, 3)} />);
    
    // Check that SVG lines are rendered
    const lines = container.querySelectorAll('line');
    expect(lines).toHaveLength(3);

    // Verify each line has proper stroke width and opacity
    lines.forEach((line, index) => {
      const strokeWidth = parseFloat(line.getAttribute('stroke-width') || '0');
      const opacity = parseFloat(line.getAttribute('opacity') || '0');
      
      // Test minimum stroke width to ensure visibility
      expect(strokeWidth).toBeGreaterThanOrEqual(2); // Minimum 2px for visibility
      
      // Test opacity is reasonable
      expect(opacity).toBeGreaterThanOrEqual(0.3); // Minimum opacity for visibility
      expect(opacity).toBeLessThanOrEqual(1);
    });
  });

  it('renders agreement score labels with correct percentages', () => {
    const scores = [
      { id1: 'model1', id2: 'model2', score: 0.1 }, // 10%
      { id1: 'model1', id2: 'model3', score: 0.15 }, // 15%
      { id1: 'model2', id2: 'model3', score: 0.73 }, // 73%
    ];

    render(<ConsensusDiagram scores={scores} models={mockModels.slice(0, 3)} />);
    
    // Check that percentages are displayed correctly
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('73%')).toBeInTheDocument();
  });

  it('applies correct color classes based on agreement score ranges', () => {
    const scores = [
      { id1: 'model1', id2: 'model2', score: 0.1 }, // Low - should be red
      { id1: 'model1', id2: 'model3', score: 0.4 }, // Medium - should be orange
      { id1: 'model2', id2: 'model3', score: 0.6 }, // High - should be yellow
      { id1: 'model1', id2: 'manual-1', score: 0.8 }, // Very High - should be green
    ];

    render(<ConsensusDiagram scores={scores} models={mockModels} />);
    
    // Check color classes for different score ranges
    const scoreElements = screen.getAllByTestId('agreement-score');
    
    // Find elements by their text content and check classes
    const lowScore = scoreElements.find(el => el.textContent?.includes('10%'));
    const mediumScore = scoreElements.find(el => el.textContent?.includes('40%'));
    const highScore = scoreElements.find(el => el.textContent?.includes('60%'));
    const veryHighScore = scoreElements.find(el => el.textContent?.includes('80%'));

    expect(lowScore?.querySelector('.text-red-500')).toBeInTheDocument();
    expect(mediumScore?.querySelector('.text-orange-500')).toBeInTheDocument();
    expect(highScore?.querySelector('.text-yellow-500')).toBeInTheDocument();
    expect(veryHighScore?.querySelector('.text-green-500')).toBeInTheDocument();
  });

  it('renders model nodes with correct provider colors', () => {
    const scores = [
      { id1: 'model1', id2: 'model2', score: 0.5 },
    ];

    const { container } = render(<ConsensusDiagram scores={scores} models={mockModels.slice(0, 2)} />);
    
    // Check that model nodes are rendered
    const modelNodes = container.querySelectorAll('.w-4.h-4.rounded-full');
    expect(modelNodes).toHaveLength(2);
    
    // Each node should have a background color style
    modelNodes.forEach(node => {
      const bgColor = (node as HTMLElement).style.backgroundColor;
      expect(bgColor).toBeTruthy(); // Should have some background color
    });
  });

  it('prevents regression for very low agreement scores visibility', () => {
    // Test specifically for the regression issue with very low scores
    const veryLowScores = [
      { id1: 'model1', id2: 'model2', score: 0.05 }, // 5%
      { id1: 'model1', id2: 'model3', score: 0.01 }, // 1%
    ];

    const { container } = render(<ConsensusDiagram scores={veryLowScores} models={mockModels.slice(0, 3)} />);
    
    const lines = container.querySelectorAll('line');
    
    lines.forEach(line => {
      const strokeWidth = parseFloat(line.getAttribute('stroke-width') || '0');
      const opacity = parseFloat(line.getAttribute('opacity') || '0');
      
      // Ensure lines are always visible regardless of low scores
      expect(strokeWidth).toBeGreaterThanOrEqual(2); // Always at least 2px
      expect(opacity).toBeGreaterThanOrEqual(0.3); // Always at least 30% opacity
    });
  });

  it('renders line labels (A, B, C, etc.) correctly', () => {
    const scores = [
      { id1: 'model1', id2: 'model2', score: 0.5 },
      { id1: 'model1', id2: 'model3', score: 0.3 },
      { id1: 'model2', id2: 'model3', score: 0.7 },
    ];

    const { container } = render(<ConsensusDiagram scores={scores} models={mockModels.slice(0, 3)} />);
    
    // Check that line labels are rendered in SVG
    const textElements = container.querySelectorAll('text');
    expect(textElements).toHaveLength(3);
    
    // Check that labels match the expected pattern (A, B, C)
    const labelTexts = Array.from(textElements).map(el => el.textContent);
    expect(labelTexts).toContain('A');
    expect(labelTexts).toContain('B');
    expect(labelTexts).toContain('C');
  });

  it('renders agreement scale legend correctly', () => {
    const scores = [{ id1: 'model1', id2: 'model2', score: 0.5 }];

    render(<ConsensusDiagram scores={scores} models={mockModels.slice(0, 2)} />);
    
    // Check that the scale legend is present
    expect(screen.getByText('Agreement Scale')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Very High')).toBeInTheDocument();
  });
});


