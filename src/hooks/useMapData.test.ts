import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMapData } from "./useMapData";
import { api } from "@/lib/apiClient";

vi.mock("supercluster", () => {
  return {
    default: class MockSupercluster {
      load() {}
      getClusters() {
        return [];
      }
    }
  };
});

vi.mock("@/lib/apiClient", () => ({
  api: {
    map: {
      pins: vi.fn(),
    }
  }
}));

describe("useMapData Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.map.pins as any).mockResolvedValue({
      ok: true,
      data: [
        {
          id: "pin-1",
          lat: 19.076,
          lng: 72.8777,
          drugCategory: "Opioids/Fentanyl",
          label: "Mumbai Seizure",
          date: "2026-08-10T00:00:00.000Z",
          riskScore: 90,
          originRoute: []
        },
        {
          id: "pin-2",
          lat: 28.6139,
          lng: 77.209,
          drugCategory: "Stimulants",
          label: "Delhi Lab",
          date: "2026-08-12T00:00:00.000Z",
          riskScore: 75,
          originRoute: []
        }
      ]
    });
  });

  it("initializes with string array categories and fetches pins", async () => {
    const { result } = renderHook(() => useMapData(3, ["Opioids/Fentanyl", "Stimulants"]));

    await waitFor(() => {
      expect(result.current.isClient).toBe(true);
      expect(result.current.mapPinsData).toHaveLength(2);
    });

    expect(result.current.activeCategories.has("Opioids/Fentanyl")).toBe(true);
    expect(result.current.activeCategories.has("Stimulants")).toBe(true);
    expect(api.map.pins).toHaveBeenCalled();
  });

  it("initializes with Set categories seamlessly", async () => {
    const categoriesSet = new Set(["Cannabis", "Psychedelics"]);
    const { result } = renderHook(() => useMapData(4, categoriesSet));

    await waitFor(() => {
      expect(result.current.isClient).toBe(true);
    });

    expect(result.current.activeCategories.has("Cannabis")).toBe(true);
    expect(result.current.activeCategories.has("Psychedelics")).toBe(true);
  });

  it("toggles categories correctly", async () => {
    const { result } = renderHook(() => useMapData(3, ["Opioids/Fentanyl"]));

    await waitFor(() => {
      expect(result.current.isClient).toBe(true);
    });

    await act(async () => {
      result.current.toggleCategory("Opioids/Fentanyl");
    });

    await waitFor(() => {
      expect(result.current.activeCategories.has("Opioids/Fentanyl")).toBe(false);
    });

    await act(async () => {
      result.current.toggleCategory("Stimulants");
    });

    await waitFor(() => {
      expect(result.current.activeCategories.has("Stimulants")).toBe(true);
    });
  });

  it("computes slider value from date range", async () => {
    const { result } = renderHook(() => useMapData(3, []));

    await waitFor(() => {
      expect(result.current.isClient).toBe(true);
    });

    expect(result.current.sliderValue).toHaveLength(2);
    expect(result.current.allDateRange.length).toBeGreaterThan(0);
  });
});
