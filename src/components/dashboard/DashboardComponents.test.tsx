// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KpiCard, SourceBadge } from './DashboardComponents';
import { Activity } from 'lucide-react';

describe('DashboardComponents', () => {
  describe('KpiCard', () => {
    it('renders correctly with positive trend', () => {
      render(
        <KpiCard 
          title="Active Targets" 
          value="1,024" 
          trend={15} 
          icon={Activity} 
          color="#10b981" 
          glowClass="test-glow" 
        />
      );
      
      expect(screen.getByText('Active Targets')).toBeInTheDocument();
      expect(screen.getByText('1,024')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('15%')).toHaveClass('text-emerald-400');
    });

    it('renders correctly with negative trend', () => {
      render(
        <KpiCard 
          title="Active Targets" 
          value="1,024" 
          trend={-5} 
          icon={Activity} 
          color="#ef4444" 
          glowClass="test-glow" 
        />
      );
      
      expect(screen.getByText('5%')).toBeInTheDocument();
      expect(screen.getByText('5%')).toHaveClass('text-red-400');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <KpiCard 
          title="Clickable" 
          value="100" 
          trend={0} 
          icon={Activity} 
          color="#ffffff" 
          glowClass="test-glow" 
          onClick={handleClick}
        />
      );
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Keyboard navigation
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('SourceBadge', () => {
    it('renders Darknet badge correctly', () => {
      render(<SourceBadge type="darknet" />);
      const badge = screen.getByText('Darknet');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-purple-400');
    });

    it('defaults to OSINT if type is unknown', () => {
      render(<SourceBadge type="unknown_type" />);
      const badge = screen.getByText('OSINT');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-emerald-400');
    });
  });
});
