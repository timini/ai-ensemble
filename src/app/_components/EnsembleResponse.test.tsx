import { render, screen } from '@testing-library/react';
import { EnsembleResponse } from './EnsembleResponse';

describe('EnsembleResponse', () => {
  it('should render the ensemble response', () => {
    const data = {
      consensusResponse: 'This is the consensus response.',
      agreementScores: { og: 0.5, ga: 0.6, ao: 0.7 },
      individualResponses: {
        openai: 'OpenAI response.',
        google: 'Google response.',
        anthropic: 'Anthropic response.',
      },
    };

    render(<EnsembleResponse data={data} consensusDiagram={<div />} />);

    expect(screen.getByText('Consensus Response')).toBeInTheDocument();
    expect(screen.getByText('This is the consensus response.')).toBeInTheDocument();
    expect(screen.getByText('Agreement Analysis')).toBeInTheDocument();
    expect(screen.getByText('Individual Responses')).toBeInTheDocument();
    expect(screen.getByText('Openai')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
  });
});
