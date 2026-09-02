// @ts-nocheck
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardData } from './useDashboardData';
import { api } from '@/lib/apiClient';

// Mock the API client
vi.mock('@/lib/apiClient', () => ({
  api: {
    dashboard: {
      kpis: vi.fn(),
      feed: vi.fn(),
      charts: vi.fn(),
    },
    reports: {
      alerts: vi.fn(),
    }
  }
}));

vi.mock('@/lib/publicApis', () => ({
  getRecentMalwareUrls: vi.fn().mockResolvedValue([]),
  getDnsRecords: vi.fn().mockResolvedValue(null)
}));

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data and update state correctly on success', async () => {
    // Setup mock responses
    (api.dashboard.kpis as any).mockResolvedValue({ ok: true, data: { activeTargets: 10 } });
    (api.dashboard.feed as any).mockResolvedValue({ ok: true, data: [{ id: '1', summary: 'test' }] });
    (api.dashboard.charts as any).mockResolvedValue({ ok: true, data: { weeklyActivity: [] } });
    (api.reports.alerts as any).mockResolvedValue({ ok: true, data: [{ id: 'alert1' }] });

    const { result } = renderHook(() => useDashboardData());

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    // Wait for the async effect to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that state was updated with API data
    expect(result.current.kpis).toEqual({ activeTargets: 10 });
    expect(result.current.feed).toHaveLength(1);
    expect(result.current.charts).toEqual({ weeklyActivity: [] });
    expect(result.current.alerts).toHaveLength(1);

    // Verify all APIs were called
    expect(api.dashboard.kpis).toHaveBeenCalledTimes(1);
    expect(api.dashboard.feed).toHaveBeenCalledWith({ limit: 12 });
    expect(api.dashboard.charts).toHaveBeenCalledTimes(1);
    expect(api.reports.alerts).toHaveBeenCalledTimes(1);
  });

  it('should handle API failures gracefully with fallback data', async () => {
    // Setup mock responses with failures
    (api.dashboard.kpis as any).mockResolvedValue({ ok: false, data: null });
    (api.dashboard.feed as any).mockResolvedValue({ ok: false, data: null });
    (api.dashboard.charts as any).mockResolvedValue({ ok: false, data: null });
    (api.reports.alerts as any).mockResolvedValue({ ok: false, data: null });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Fallbacks should be gracefully populated
    expect(result.current.kpis).toBeDefined();
    expect(result.current.feed.length).toBeGreaterThan(0);
    expect(result.current.charts).toBeDefined();
    expect(result.current.alerts.length).toBeGreaterThan(0);
  });
});
