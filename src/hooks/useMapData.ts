import { useState, useEffect, useMemo, useCallback } from 'react';
import Supercluster from 'supercluster';
import { api } from '@/lib/apiClient';
import { type MapPin, mapPinsData as mockMapPinsData } from '@/lib/mockData';

const defaultMin = "2026-08-01";
const defaultMax = "2026-08-17";

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function useMapData(
  zoom: number,
  initialCategories: string[] | Set<string>,
  riskRange?: [number, number]
) {
  const [globalMinDate, setGlobalMinDate] = useState(defaultMin);
  const [globalMaxDate, setGlobalMaxDate] = useState(defaultMax);
  const [dateRange, setDateRange] = useState<[string, string]>([defaultMin, defaultMax]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => (initialCategories instanceof Set ? new Set(initialCategories) : new Set(initialCategories || []))
  );
  const [mapPinsData, setMapPinsData] = useState<MapPin[]>([]);
  const [isClient, setIsClient] = useState(false);

  const initialCategoriesKey = Array.from(initialCategories || []).sort().join(',');

  // Sync external categories changes only when serialized contents change
  useEffect(() => {
    setActiveCategories(new Set(initialCategories || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategoriesKey]);

  const riskMin = riskRange?.[0] ?? 0;
  const riskMax = riskRange?.[1] ?? 100;
  const categoriesParam = useMemo(() => Array.from(activeCategories).sort().join(','), [activeCategories]);
  const startDate = dateRange[0];
  const endDate = dateRange[1];

  // Server-side filtering: Fetch from API whenever dateRange or categories change
  useEffect(() => {
    let isCancelled = false;
    setIsClient(true);
    
    api.map.pins({
      startDate,
      endDate,
      drugCategory: categoriesParam,
      riskMin,
      riskMax
    }).then((res) => {
      if (isCancelled) return;
      if (res.ok && res.data) {
        setMapPinsData(res.data.map((p: any) => ({
          ...p,
          date: p.date.split('T')[0],
          details: p.quantityEst || `${p.city}, ${p.country}`,
          linkedNodeIds: [],
        })));
      }
    }).catch(err => {
      if (isCancelled) return;
      console.error("Critical Map Fetch Error:", err);
    });

    return () => {
      isCancelled = true;
    };
  }, [startDate, endDate, categoriesParam, riskMin, riskMax]);

  // Keep filteredPins as an alias for mapPinsData to avoid refactoring MapView deeply
  const filteredPins = mapPinsData;

  const allDateRange = useMemo(() => getDateRange(globalMinDate, globalMaxDate), [globalMinDate, globalMaxDate]);
  
  const sliderValue = useMemo(() => {
    const start = allDateRange.indexOf(dateRange[0]);
    const end = allDateRange.indexOf(dateRange[1]);
    return [Math.max(0, start), Math.max(0, end)];
  }, [dateRange, allDateRange]);

  // Supercluster for client-side clustering
  const { clusters, supercluster, unclusteredPoints, clusterNodes } = useMemo(() => {
    const sc = new Supercluster({
      radius: 40,
      maxZoom: 16,
    });
    
    const geojsonFeatures = filteredPins.map((pin) => ({
      type: "Feature" as const,
      properties: { cluster: false, ...pin },
      geometry: {
        type: "Point" as const,
        coordinates: [pin.lng, pin.lat],
      },
    }));

    sc.load(geojsonFeatures);

    const bounds = [-180, -85, 180, 85];
    const cl = sc.getClusters(bounds as any, Math.floor(zoom));

    return {
      supercluster: sc,
      clusters: cl,
      unclusteredPoints: cl.filter((c) => !c.properties.cluster),
      clusterNodes: cl.filter((c) => c.properties.cluster),
    };
  }, [filteredPins, zoom]);

  const toggleCategory = useCallback((name: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  return {
    isClient,
    mapPinsData,
    filteredPins,
    supercluster,
    clusters,
    unclusteredPoints,
    clusterNodes,
    globalMinDate,
    globalMaxDate,
    dateRange,
    setDateRange,
    allDateRange,
    sliderValue,
    activeCategories,
    toggleCategory,
  };
}
