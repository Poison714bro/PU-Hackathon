import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders a status badge correctly', () => {
    render(<StatusBadge type="status" value="Open" />);
    const badge = screen.getByText('Open');
    expect(badge).toBeInTheDocument();
    // 'Open' maps to cyan-400 classes
    expect(badge).toHaveClass('text-primary');
    expect(badge).toHaveClass('bg-cyan-400/10');
  });

  it('renders a risk badge correctly', () => {
    render(<StatusBadge type="risk" value="Critical" />);
    const badge = screen.getByText('Critical');
    expect(badge).toBeInTheDocument();
    // 'Critical' maps to red-400 classes
    expect(badge).toHaveClass('text-red-400');
    expect(badge).toHaveClass('bg-red-500/15');
  });

  it('falls back to default neutral styles for unknown values', () => {
    render(<StatusBadge type="status" value="UnknownState" />);
    const badge = screen.getByText('UnknownState');
    expect(badge).toBeInTheDocument();
    // Neutral fallback classes
    expect(badge).toHaveClass('text-muted-foreground');
    expect(badge).toHaveClass('bg-slate-500/10');
  });
});
