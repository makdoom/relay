import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App Smoke Test (Phase 1 Setup)', () => {
  it('renders the Relay title and initialization status', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { name: /relay messaging/i });
    expect(heading).toBeInTheDocument();

    const subtitle = screen.getByText(/Phase 1 Tooling & Developer Environment Initialized/i);
    expect(subtitle).toBeInTheDocument();
  });
});
