import { render, screen } from '@testing-library/react';
import RootLayout from './layout';
import { vi } from 'vitest';

// Mock TRPCReactProvider
vi.mock('@/trpc/react', () => ({
  TRPCReactProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-trpc-provider">{children}</div>
  ),
}));

// Mock Geist font
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({
    variable: '--font-geist-sans',
    className: '--font-geist-sans',
  })),
}));

describe('RootLayout', () => {
  it('should render children and apply correct html attributes', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Child Content</div>
      </RootLayout>
    );

    // Check if children are rendered
    expect(screen.getByTestId('test-child')).toBeInTheDocument();

    // Check if TRPCReactProvider is rendered
    expect(screen.getByTestId('mock-trpc-provider')).toBeInTheDocument();

    // Check html attributes
    const htmlElement = document.documentElement;
    expect(htmlElement).toHaveAttribute('lang', 'en');
    expect(htmlElement).toHaveClass('--font-geist-sans'); // Assuming Geist font applies this class
  });
});
