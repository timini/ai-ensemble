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

// Mock useEnsembleState hook
vi.mock('./_hooks/useEnsembleState');

describe('Home page', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render the page with mocked components initially', () => {
    (useEnsembleState as vi.Mock).mockReturnValue({
      ensembleQuery: { isPending: false, error: null, data: null },
    });
    render(<Home />);

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-query-form')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-ensemble-response')).not.toBeInTheDocument();
  });

  it('should display loading message when ensembleQuery is pending', () => {
    (useEnsembleState as vi.Mock).mockReturnValue({
      ensembleQuery: { isPending: true, error: null, data: null },
    });
    render(<Home />);
    expect(screen.getByText('Querying the ensemble...')).toBeInTheDocument();
  });

  it('should display error message when ensembleQuery has an error', () => {
    (useEnsembleState as vi.Mock).mockReturnValue({
      ensembleQuery: { isPending: false, error: new Error('Test error'), data: null },
    });
    render(<Home />);
    expect(screen.getByText(/An error occurred:/)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('should display EnsembleResponse when ensembleQuery has data', () => {
    (useEnsembleState as vi.Mock).mockReturnValue({
      ensembleQuery: { isPending: false, error: null, data: { consensusResponse: 'Test data' } },
    });
    render(<Home />);
    expect(screen.getByTestId('mock-ensemble-response')).toBeInTheDocument();
  });
});