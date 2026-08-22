"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Filter,
  Layers,
  Search,
  Play,
  Pause,
} from "lucide-react";
import Map, { Marker } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import { PathStyleExtension } from "@deck.gl/extensions";
import Supercluster from "supercluster";
import { useDebounce } from "use-debounce";
import { type MapPin } from "@/lib/mockData";
import { api } from "@/lib/apiClient";
import { getDrugColor } from "@/lib/utils";


import { useAppStore } from "@/lib/store";
import EvidenceDrawer from "@/components/ui/EvidenceDrawer";
import "maplibre-gl/dist/maplibre-gl.css";

const drugCategories = [
  { name: "Opioids/Fentanyl", color: "#FF4500", icon: "💊" },
  { name: "Stimulants", color: "#00FFFF", icon: "⚡" },
  { name: "Cannabis", color: "#39FF14", icon: "🌿" },
  { name: "Psychedelics", color: "#B026FF", icon: "🔮" },
  { name: "Prescription/Other", color: "#FFD700", icon: "💉" },
];

// Initial defaults, but these will be updated from state
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

const hexToRgbCache: Record<string, [number, number, number, number]> = {};
function cachedHexToRgb(hex: string, alpha: number = 255): [number, number, number, number] {
  const cacheKey = `${hex}-${alpha}`;
  if (hexToRgbCache[cacheKey]) return hexToRgbCache[cacheKey];
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  const rgb: [number, number, number, number] = [r, g, b, alpha];
  hexToRgbCache[cacheKey] = rgb;
  return rgb;
}

const INITIAL_VIEW_STATE = {
  longitude: 78.0,
  latitude: 22.0,
  zoom: 4,
  pitch: 0,
  bearing: 0,
  transitionDuration: 0,
};

const darkMapStyle = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors &copy; CARTO",
      maxzoom: 19
    }
  },
  layers: [
    {
      id: "carto",
      type: "raster",
      source: "carto"
    }
  ]
};

function formatShortDate(isoString: string) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toISOString().split("T")[0];
  } catch {
    return isoString.split("T")[0];
  }
}

export default function MapView() {
  const [globalMinDate, setGlobalMinDate] = useState(defaultMin);
  const [globalMaxDate, setGlobalMaxDate] = useState(defaultMax);
  const [dateRange, setDateRange] = useState<[string, string]>([defaultMin, defaultMax]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(drugCategories.map((c) => c.name))
  );
  
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [debouncedViewState] = useDebounce(viewState, 200);
  
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapPinsData, setMapPinsData] = useState<MapPin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const playRef = useRef<NodeJS.Timeout | null>(null);

  // Store integration
  const storeSelectedId = useAppStore((s) => s.selectedEntityId);
  const storeSelectedType = useAppStore((s) => s.selectedEntityType);
  const selectEntity = useAppStore((s) => s.selectEntity);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const filters = useAppStore((s) => s.filters);

  useEffect(() => {
    setIsClient(true);
    // Fetch map pins from backend API
    api.map.pins().then((res) => {
      if (res.ok && res.data) {
        setMapPinsData(res.data.map((p: any) => ({
          id: p.id,
          lat: p.lat,
          lng: p.lng,
          drugCategory: p.drugCategory,
          label: p.label,
          date: p.date.split('T')[0],
          details: p.quantityEst || `${p.city}, ${p.country}`,
          riskScore: p.riskScore,
          linkedNodeIds: [],
          originRoute: [],
        })));
        
        // Dynamically set date range bounds based on data
        const dates = res.data.map((p: any) => p.date.split('T')[0]).sort();
        if (dates.length > 0) {
          setGlobalMinDate(dates[0]);
          setGlobalMaxDate(dates[dates.length - 1]);
          setDateRange([dates[0], dates[dates.length - 1]]);
        }
      }
    });
  }, []);

  // Sync store selection into local state
  useEffect(() => {
    if (storeSelectedType === "pin" && storeSelectedId) {
      setSelectedPin(storeSelectedId);
    }
  }, [storeSelectedId, storeSelectedType]);

  // Sync filters from store
  useEffect(() => {
    setActiveCategories(new Set(filters.drugCategories));
  }, [filters.drugCategories]);

  const allDateRange = useMemo(() => getDateRange(globalMinDate, globalMaxDate), [globalMinDate, globalMaxDate]);
  const sliderValue = useMemo(() => {
    const start = allDateRange.indexOf(dateRange[0]);
    const end = allDateRange.indexOf(dateRange[1]);
    return [Math.max(0, start), Math.max(0, end)];
  }, [dateRange, allDateRange]);

  const filteredPins = useMemo(() => {
    return mapPinsData.filter((pin: any) => {
      const dateMatch = pin.date >= dateRange[0] && pin.date <= dateRange[1];
      const categoryMatch = activeCategories.has(pin.drugCategory);
      const riskMatch = pin.riskScore >= filters.riskRange[0] && pin.riskScore <= filters.riskRange[1];
      return dateMatch && categoryMatch && riskMatch;
    });
  }, [dateRange, activeCategories, filters.riskRange, mapPinsData]);

  // Supercluster for clustering
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

    const bounds = [
      -180, -85, 180, 85 // global bounds by default to prevent disappearing points before interaction
    ];

    const cl = sc.getClusters(bounds as any, Math.floor(debouncedViewState.zoom));

    return {
      supercluster: sc,
      clusters: cl,
      unclusteredPoints: cl.filter((c) => !c.properties.cluster),
      clusterNodes: cl.filter((c) => c.properties.cluster),
    };
  }, [filteredPins, debouncedViewState.zoom]);

  const toggleCategory = useCallback((name: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, which: "start" | "end") => {
    const idx = parseInt(e.target.value);
    if (which === "start") {
      setDateRange((prev) => [allDateRange[Math.min(idx, sliderValue[1])], prev[1]]);
    } else {
      setDateRange((prev) => [prev[0], allDateRange[Math.max(idx, sliderValue[0])]]);
    }
  }, [allDateRange, sliderValue]);

  const handleFlyTo = useCallback((pin: MapPin) => {
    setViewState((prev) => ({
      ...prev,
      longitude: pin.lng,
      latitude: pin.lat,
      zoom: 12,
      transitionDuration: 1000,
    }));
  }, []);

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const match = mapPinsData.find(p => p.label.toLowerCase().includes(query) || p.drugCategory.toLowerCase().includes(query));
      if (match) {
        handleFlyTo(match);
        handlePinClick(match.id);
      }
    }
  }, [searchQuery, mapPinsData, handleFlyTo]);

  const handlePinClick = useCallback((pinId: string) => {
    setSelectedPin(pinId);
    const pin = mapPinsData.find((p) => p.id === pinId);
    if (pin) {
      selectEntity(pinId, "pin", pin.linkedNodeIds);
    }
  }, [selectEntity, mapPinsData]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedPin(null);
    clearSelection();
  }, [clearSelection]);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    let currentIdx = 0;
    playRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx >= allDateRange.length) {
        if (playRef.current) clearInterval(playRef.current);
        setIsPlaying(false);
        setDateRange([globalMinDate, globalMaxDate]);
        return;
      }
      setDateRange([globalMinDate, allDateRange[currentIdx]]);
    }, 400);
  }, [allDateRange, globalMinDate, globalMaxDate]);

  const stopPlayback = useCallback(() => {
    if (playRef.current) clearInterval(playRef.current);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, []);

  const selectedPinData = selectedPin ? mapPinsData.find((p) => p.id === selectedPin) : null;

  // Deck.gl Layers
  const layers = useMemo(() => [
    // Scatterplot for individual pins
    new ScatterplotLayer({
      id: "scatter-layer",
      data: unclusteredPoints,
      getPosition: (d: any) => d.geometry.coordinates,
      getFillColor: (d: any) => cachedHexToRgb(getDrugColor(d.properties.drugCategory), 200),
      getLineColor: (d: any) => {
        const isSelected = selectedPin === d.properties.id || (storeSelectedType === "pin" && storeSelectedId === d.properties.id);
        return isSelected ? [255, 255, 255, 255] : [0, 0, 0, 0];
      },
      getLineWidth: (d: any) => {
         const isSelected = selectedPin === d.properties.id || (storeSelectedType === "pin" && storeSelectedId === d.properties.id);
         return isSelected ? 2 : 0;
      },
      lineWidthUnits: 'pixels',
      getRadius: (d: any) => {
        const isSelected = selectedPin === d.properties.id || (storeSelectedType === "pin" && storeSelectedId === d.properties.id);
        return isSelected ? 12 : 8 + d.properties.riskScore / 20;
      },
      radiusUnits: 'pixels',
      radiusMinPixels: 4,
      radiusMaxPixels: 20,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100],
      onClick: (info: any) => {
        if (info.object && !info.object.properties.cluster) {
          handlePinClick(info.object.properties.id);
        }
      },
      onHover: (info: any) => setHoverInfo(info),
      updateTriggers: {
        getLineColor: [selectedPin, storeSelectedId],
        getLineWidth: [selectedPin, storeSelectedId],
        getRadius: [selectedPin, storeSelectedId],
      }
    }),
    
    // Cluster bubbles
    new ScatterplotLayer({
      id: "cluster-scatter-layer",
      data: clusterNodes,
      getPosition: (d: any) => d.geometry.coordinates,
      getFillColor: [71, 85, 105, 230], // Bright Slate-600 for clusters so they are visible on dark background
      getLineColor: [255, 255, 255, 150],
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      getRadius: (d: any) => Math.min(20 + d.properties.point_count * 2, 40),
      radiusUnits: 'pixels',
      pickable: true,
      onClick: (info: any) => {
        if (info.object && info.object.properties.cluster) {
          const expansionZoom = supercluster.getClusterExpansionZoom(info.object.properties.cluster_id);
          setViewState((prev) => ({
            ...prev,
            longitude: info.object.geometry.coordinates[0],
            latitude: info.object.geometry.coordinates[1],
            zoom: expansionZoom,
            transitionDuration: 500,
          }));
        }
      },
      onHover: (info: any) => setHoverInfo(info),
    }),
    
    // Cluster text
    new TextLayer({
      id: 'cluster-text-layer',
      data: clusterNodes,
      getPosition: (d: any) => d.geometry.coordinates,
      getText: (d: any) => d.properties.point_count.toString(),
      getSize: 14,
      getColor: [255, 255, 255, 255],
      getAlignmentBaseline: 'center',
      fontFamily: 'system-ui',
    }),
    
    // Routes (PathLayer) for selected pin
    new PathLayer({
      id: "path-layer",
      data: selectedPinData && selectedPinData.originRoute.length > 1 ? [selectedPinData] : [],
      getPath: (d: any) => d.originRoute.map((p: any) => [p.lng, p.lat]),
      getColor: (d: any) => cachedHexToRgb(getDrugColor(d.drugCategory), 200),
      getWidth: 4,
      widthUnits: 'pixels',
      dashJustified: true,
      getDashArray: [3, 2],
      extensions: [new PathStyleExtension({dash: true})],
    }),
  ], [unclusteredPoints, clusterNodes, supercluster, selectedPin, storeSelectedId, storeSelectedType, selectedPinData, handlePinClick]);

  return (
    <div className="relative flex h-full overflow-hidden bg-[#030711] text-slate-200">
      <div className="flex flex-1 flex-col relative">
        {/* Top-Left Search (Google Maps style) */}
        <div className="absolute top-4 left-4 z-[5] flex items-center gap-2 rounded-lg bg-[#0a0f18] px-4 py-3 shadow-lg ring-1 ring-slate-800 transition-all focus-within:ring-cyan-500">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search locations, routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-64 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
          />
        </div>



        {/* Map Container */}
        <div className="relative flex-1">
          {isClient && (
            <DeckGL
              layers={layers}
              viewState={viewState}
              onViewStateChange={(e: { viewState: any }) => setViewState(e.viewState)}
              controller={true}
              getCursor={({ isDragging }: { isDragging: boolean }) => (isDragging ? 'grabbing' : 'grab')}
            >
              <Map
                mapStyle={darkMapStyle}
                reuseMaps
              >
                {/* CSS Pulsing Marker for Selected Point */}
                {selectedPinData && (
                  <Marker longitude={selectedPinData.lng} latitude={selectedPinData.lat} anchor="center">
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <div
                        className="absolute h-full w-full animate-ping rounded-full opacity-50"
                        style={{ backgroundColor: getDrugColor(selectedPinData.drugCategory) }}
                      />
                      <div
                        className="h-4 w-4 rounded-full border-2 border-white shadow-lg"
                        style={{ backgroundColor: getDrugColor(selectedPinData.drugCategory) }}
                      />
                    </div>
                  </Marker>
                )}
              </Map>

              {/* High-performance DeckGL tooltip */}
              {hoverInfo && hoverInfo.object && (
                <div
                  className="pointer-events-none absolute z-40 rounded-lg border border-slate-800 bg-[#0a0f18]/95 p-3 text-sm shadow-xl backdrop-blur-md"
                  style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
                >
                  {hoverInfo.object.properties.cluster ? (
                    <div>
                      <strong className="text-white">Activity Cluster</strong>
                      <div className="text-slate-400">
                        {hoverInfo.object.properties.point_count} evidence points
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-white">{hoverInfo.object.properties.label}</strong>
                      <div className="text-slate-300 mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shadow-sm" style={{ background: getDrugColor(hoverInfo.object.properties.drugCategory) }} />
                        <span className="text-xs">{hoverInfo.object.properties.drugCategory}</span>
                      </div>
                      <div className="text-slate-500 mt-2 text-xs">
                        Risk Score: <span className="font-semibold text-white">{hoverInfo.object.properties.riskScore}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DeckGL>
          )}
        </div>

        {/* Timeline / Calendar Panel (Dark Glassmorphism Bottom Center) */}
        <div className="absolute bottom-6 left-1/2 z-[5] -translate-x-1/2 rounded-xl border border-slate-800/80 bg-[#0a0f18]/90 p-5 shadow-2xl backdrop-blur-md transition-all hover:bg-[#0a0f18]/95 focus:outline-none focus:ring-2 focus:ring-cyan-500">
          <div className="w-[640px]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Timeline Filter</span>
                {/* Play/Pause button */}
                <button
                  onClick={isPlaying ? stopPlayback : startPlayback}
                  className={`ml-2 flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                    isPlaying
                      ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-400 shadow-inner"
                      : "border-slate-700 bg-[#070a10] text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 shadow-sm"
                  }`}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-[#070a10] p-1.5 border border-slate-800">
                <span className="px-2 font-mono text-[11px] font-medium text-slate-300">
                  {formatShortDate(dateRange[0])}
                </span>
                <span className="text-[10px] font-medium text-slate-500">to</span>
                <span className="px-2 font-mono text-[11px] font-medium text-slate-300">
                  {formatShortDate(dateRange[1])}
                </span>
              </div>
            </div>

            {/* Dual Range Slider */}
            <div className="relative h-8">
              <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full bg-slate-200" />
              <div
                className="absolute top-3 h-1.5 rounded-full bg-blue-500"
                style={{
                  left: `${(sliderValue[0] / Math.max(allDateRange.length - 1, 1)) * 100}%`,
                  right: `${100 - (sliderValue[1] / Math.max(allDateRange.length - 1, 1)) * 100}%`,
                }}
              />
              <input
                type="range"
                min={0}
                max={allDateRange.length - 1}
                value={sliderValue[0]}
                onChange={(e) => handleSliderChange(e, "start")}
                className="absolute left-0 right-0 top-1 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0a0f18] [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-md"
                style={{ zIndex: 3 }}
                disabled={isPlaying}
              />
              <input
                type="range"
                min={0}
                max={allDateRange.length - 1}
                value={sliderValue[1]}
                onChange={(e) => handleSliderChange(e, "end")}
                className="absolute left-0 right-0 top-1 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0a0f18] [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-md"
                style={{ zIndex: 4 }}
                disabled={isPlaying}
              />
            </div>

            {/* Date ticks */}
            <div className="mt-1 flex justify-between text-[9px] font-medium text-muted-foreground">
              {allDateRange.filter((_, i) => i % Math.max(1, Math.floor(allDateRange.length / 6)) === 0 || i === allDateRange.length - 1).map((date) => (
                <span key={date}>{date.slice(5)}</span>
              ))}
            </div>

            {/* Drug Filters */}
            <div className="mt-5 border-t border-slate-800/60 pt-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Filter by Drug Type
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {drugCategories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                      activeCategories.has(cat.name)
                        ? "bg-[#070a10] text-slate-200 border border-slate-700 shadow-sm"
                        : "text-slate-500 border border-slate-800 bg-transparent hover:bg-slate-800/50 hover:text-slate-400"
                    }`}
                  >
                    <div
                      className="h-2 w-2 rounded-full shadow-sm"
                      style={{ background: activeCategories.has(cat.name) ? cat.color : "#334155" }}
                    />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Drawer */}
      {selectedPinData && (
        <EvidenceDrawer
          type="pin"
          pinData={selectedPinData}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  );
}
