import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('should render the header', () => {
    render(<Header />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/ai ensemble/i);
    expect(screen.getByText('Comparison. Consensus. Synthesis.')).toBeInTheDocument();
  });
});
