// @ts-nocheck
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';
import { api } from '@/lib/apiClient';

// Mock the API client
jest.mock('@/lib/apiClient', () => ({
  api: {
    dashboard: {
      kpis: jest.fn(),
      feed: jest.fn(),
      charts: jest.fn(),
    },
    reports: {
      alerts: jest.fn(),
    }
  }
}));

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data and update state correctly on success', async () => {
    // Setup mock responses
    (api.dashboard.kpis as jest.Mock).mockResolvedValue({ ok: true, data: { activeTargets: 10 } });
    (api.dashboard.feed as jest.Mock).mockResolvedValue({ ok: true, data: [{ id: '1', summary: 'test' }] });
    (api.dashboard.charts as jest.Mock).mockResolvedValue({ ok: true, data: { weeklyActivity: [] } });
    (api.reports.alerts as jest.Mock).mockResolvedValue({ ok: true, data: [{ id: 'alert1' }] });

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

  it('should handle API failures gracefully', async () => {
    // Setup mock responses with failures
    (api.dashboard.kpis as jest.Mock).mockResolvedValue({ ok: false, data: null });
    (api.dashboard.feed as jest.Mock).mockResolvedValue({ ok: false, data: null });
    (api.dashboard.charts as jest.Mock).mockResolvedValue({ ok: false, data: null });
    (api.reports.alerts as jest.Mock).mockResolvedValue({ ok: false, data: null });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Fallbacks should be used (null or empty arrays)
    expect(result.current.kpis).toBeNull();
    expect(result.current.feed).toEqual([]);
    expect(result.current.charts).toBeNull();
    expect(result.current.alerts).toEqual([]);
  });
});
