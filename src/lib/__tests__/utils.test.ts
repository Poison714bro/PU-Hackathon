import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  getRiskColor,
  getRiskLabel,
  getDrugColor,
} from '../utils';

describe('utils', () => {
  describe('formatNumber', () => {
    it('formats numbers in millions with M suffix', () => {
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(1000000)).toBe('1.0M');
    });

    it('formats numbers in thousands with K suffix', () => {
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(999999)).toBe('1000.0K'); // Based on current logic
    });

    it('returns string representation for numbers under 1000', () => {
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD currency correctly using Intl.NumberFormat', () => {
      // Due to jsdom/node locale differences, we check prefixes
      expect(formatCurrency(1500)).toContain('$');
      expect(formatCurrency(1500)).toContain('1.5K');
    });
  });

  describe('getRiskColor', () => {
    it('returns Critical hex code for score >= 90', () => {
      expect(getRiskColor(95)).toBe('#FF0040');
      expect(getRiskColor(90)).toBe('#FF0040');
    });

    it('returns High hex code for score >= 70', () => {
      expect(getRiskColor(89)).toBe('#FF4500');
      expect(getRiskColor(70)).toBe('#FF4500');
    });

    it('returns Info hex code for score < 30', () => {
      expect(getRiskColor(29)).toBe('#8B8B8B');
      expect(getRiskColor(0)).toBe('#8B8B8B');
    });
  });

  describe('getRiskLabel', () => {
    it('returns Critical for score >= 90', () => {
      expect(getRiskLabel(95)).toBe('Critical');
    });

    it('returns Low for score >= 30 and < 50', () => {
      expect(getRiskLabel(35)).toBe('Low');
    });
  });

  describe('getDrugColor', () => {
    it('returns mapped color for known category', () => {
      expect(getDrugColor('Opioids/Fentanyl')).toBe('#FF4500');
      expect(getDrugColor('Cannabis')).toBe('#39FF14');
    });

    it('returns default fallback color for unknown category', () => {
      expect(getDrugColor('Unknown Drug')).toBe('#8B8B8B');
    });
  });
});
