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
  initialCategories: string[],
  riskRange?: [number, number]
) {
  const [globalMinDate, setGlobalMinDate] = useState(defaultMin);
  const [globalMaxDate, setGlobalMaxDate] = useState(defaultMax);
  const [dateRange, setDateRange] = useState<[string, string]>([defaultMin, defaultMax]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(initialCategories));
  const [mapPinsData, setMapPinsData] = useState<MapPin[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Sync external categories changes
  useEffect(() => {
    setActiveCategories(new Set(initialCategories));
  }, [initialCategories]);

  // Server-side filtering: Fetch from API whenever dateRange or categories change
  useEffect(() => {
    setIsClient(true);
    
    // Convert Set to comma separated string for the backend
    const categoriesParam = Array.from(activeCategories).join(',');
    
    api.map.pins({
      startDate: dateRange[0],
      endDate: dateRange[1],
      drugCategory: categoriesParam,
      riskMin: riskRange?.[0] ?? 0,
      riskMax: riskRange?.[1] ?? 100
    }).then((res) => {
      if (res.ok && res.data) {
        setMapPinsData(res.data.map((p: any) => ({
          ...p,
          date: p.date.split('T')[0],
          details: p.quantityEst || `${p.city}, ${p.country}`,
          linkedNodeIds: [],
        })));
      }
    }).catch(err => {
      console.error("Critical Map Fetch Error:", err);
    });
  }, [dateRange, activeCategories, riskRange]);

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
