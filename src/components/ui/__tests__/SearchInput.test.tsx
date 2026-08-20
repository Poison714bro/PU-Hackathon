import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchInput from '../SearchInput';
import userEvent from '@testing-library/user-event';

describe('SearchInput', () => {
  it('renders the input correctly with a placeholder', () => {
    render(<SearchInput placeholder="Search here..." />);
    const input = screen.getByPlaceholderText('Search here...');
    expect(input).toBeInTheDocument();
  });

  it('allows the user to type in the input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchInput placeholder="Search" onChange={handleChange} />);
    
    const input = screen.getByPlaceholderText('Search');
    await user.type(input, 'test query');
    
    expect(input).toHaveValue('test query');
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies custom class names', () => {
    render(<SearchInput placeholder="Search" className="custom-test-class" />);
    const input = screen.getByPlaceholderText('Search');
    expect(input).toHaveClass('custom-test-class');
  });
});
