// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './store';

describe('Zustand App Store', () => {
  beforeEach(() => {
    // Reset store before each test if possible, or just reset state manually
    useAppStore.setState({
      activeView: "dashboard",
      sidebarOpen: false,
      searchQuery: "",
      filters: {
        drugCategories: new Set(),
        sourceStreams: new Set(),
        suspectRoles: new Set(),
        riskRange: [0, 100],
      }
    });
  });

  it('should set active view and close sidebar', () => {
    useAppStore.getState().setActiveView('map');
    const state = useAppStore.getState();
    expect(state.activeView).toBe('map');
    expect(state.sidebarOpen).toBe(false);
  });

  it('should toggle sidebar open state', () => {
    useAppStore.getState().setSidebarOpen(true);
    expect(useAppStore.getState().sidebarOpen).toBe(true);
    useAppStore.getState().setSidebarOpen(false);
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('should set search query', () => {
    useAppStore.getState().setSearchQuery('DarkFox');
    expect(useAppStore.getState().searchQuery).toBe('DarkFox');
  });

  it('should toggle drug categories correctly', () => {
    const toggle = useAppStore.getState().toggleDrugCategory;
    toggle('Opioids/Fentanyl');
    expect(useAppStore.getState().filters.drugCategories.has('Opioids/Fentanyl')).toBe(true);
    toggle('Opioids/Fentanyl');
    expect(useAppStore.getState().filters.drugCategories.has('Opioids/Fentanyl')).toBe(false);
  });

  it('should set risk range', () => {
    useAppStore.getState().setRiskRange([20, 80]);
    expect(useAppStore.getState().filters.riskRange).toEqual([20, 80]);
  });
});
