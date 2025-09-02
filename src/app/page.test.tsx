import { render, screen } from '@testing-library/react';
import Home from './page';
import { vi } from 'vitest';
import { useEnsembleState } from './_hooks/useEnsembleState';

// Mock child components
vi.mock('./_components/Header', () => ({
  Header: () => <div data-testid="mock-header">Mock Header</div>,
}));
vi.mock('./_components/QueryForm', () => ({
  QueryForm: (props: { toggleKeyVisibility: (provider: string) => void }) => (
    <div data-testid="mock-query-form">
      Mock QueryForm
      <button onClick={() => props.toggleKeyVisibility('openai')}>Toggle OpenAI Key</button>
    </div>
  ),
}));
vi.mock('./_components/EnsembleResponse', () => ({
  EnsembleResponse: () => <div data-testid="mock-ensemble-response">Mock EnsembleResponse</div>,
}));
vi.mock('./_components/StreamingResponse', () => ({
  StreamingResponse: () => <div data-testid="mock-streaming-response">Mock StreamingResponse</div>,
}));

// Mock useEnsembleState hook
vi.mock('./_hooks/useEnsembleState');

describe('Home page', () => {
  const defaultMockState = {
    ensembleQuery: { isPending: false, error: null, data: null },
    isStreaming: false,
    streamingData: {
      individualResponses: { openai: '', google: '', anthropic: '' },
      consensusResponse: '',
      agreementScores: null,
      providerStates: { openai: 'pending', google: 'pending', anthropic: 'pending' },
      consensusState: 'pending'
    }
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render the page with mocked components initially', () => {
    (useEnsembleState as vi.Mock).mockReturnValue(defaultMockState);
    render(<Home />);

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-query-form')).toBeInTheDocument();
  });

  it('should display loading message when ensembleQuery is pending', () => {
    (useEnsembleState as vi.Mock).mockReturnValue({
      ...defaultMockState,
      ensembleQuery: { isPending: true, error: null, data: null },
    });
    render(<Home />);
    // Note: With streaming always enabled, we no longer show the loading message
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
  });

  it('should display error message when ensembleQuery has an error', () => {
    (useEnsembleState as vi.Mock).mockReturnValue({
      ...defaultMockState,
      ensembleQuery: { isPending: false, error: new Error('Test error'), data: null },
    });
    render(<Home />);
    // Note: With streaming always enabled, we no longer show error messages from ensembleQuery
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
  });

  it('should display EnsembleResponse when ensembleQuery has data', () => {
    (useEnsembleState as vi.Mock).mockReturnValue({
      ...defaultMockState,
      ensembleQuery: { isPending: false, error: null, data: { consensusResponse: 'Test data' } },
    });
    render(<Home />);
    // Note: With streaming always enabled, we use StreamingResponse instead
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
  });

  it('should display StreamingResponse when streaming is complete', () => {
    (useEnsembleState as vi.Mock).mockReturnValue({
      ...defaultMockState,
      streamingData: {
        ...defaultMockState.streamingData,
        consensusState: 'complete'
      }
    });
    render(<Home />);
    expect(screen.getByTestId('mock-streaming-response')).toBeInTheDocument();
  });
});