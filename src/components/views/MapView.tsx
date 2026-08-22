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
import { mapPinsData, type MapPin } from "@/lib/mockData";
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

const allDates = Array.from(new Set(mapPinsData.map((p) => p.date))).sort();
const minDate = allDates[0];
const maxDate = allDates[allDates.length - 1];

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

const osmMapStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors",
      maxzoom: 19
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm"
    }
  ]
};

export default function MapView() {
  const [dateRange, setDateRange] = useState<[string, string]>([minDate, maxDate]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(drugCategories.map((c) => c.name))
  );
  
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [debouncedViewState] = useDebounce(viewState, 200);
  
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<NodeJS.Timeout | null>(null);

  // Store integration
  const storeSelectedId = useAppStore((s) => s.selectedEntityId);
  const storeSelectedType = useAppStore((s) => s.selectedEntityType);
  const selectEntity = useAppStore((s) => s.selectEntity);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const filters = useAppStore((s) => s.filters);

  useEffect(() => {
    setIsClient(true);
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

  const allDateRange = useMemo(() => getDateRange(minDate, maxDate), []);
  const sliderValue = useMemo(() => {
    const start = allDateRange.indexOf(dateRange[0]);
    const end = allDateRange.indexOf(dateRange[1]);
    return [Math.max(0, start), Math.max(0, end)];
  }, [dateRange, allDateRange]);

  const filteredPins = useMemo(() => {
    return mapPinsData.filter((pin) => {
      const dateMatch = pin.date >= dateRange[0] && pin.date <= dateRange[1];
      const categoryMatch = activeCategories.has(pin.drugCategory);
      const riskMatch = pin.riskScore >= filters.riskRange[0] && pin.riskScore <= filters.riskRange[1];
      return dateMatch && categoryMatch && riskMatch;
    });
  }, [dateRange, activeCategories, filters.riskRange]);

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

  const handlePinClick = useCallback((pinId: string) => {
    setSelectedPin(pinId);
    const pin = mapPinsData.find((p) => p.id === pinId);
    if (pin) {
      selectEntity(pinId, "pin", pin.linkedNodeIds);
    }
  }, [selectEntity]);

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
        setDateRange([minDate, maxDate]);
        return;
      }
      setDateRange([minDate, allDateRange[currentIdx]]);
    }, 400);
  }, [allDateRange]);

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
      getFillColor: [40, 40, 40, 230], // Dark grey for clusters
      getLineColor: [255, 255, 255, 100],
      getLineWidth: 1,
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
    <div className="relative flex h-full overflow-hidden bg-slate-50 text-slate-900">
      <div className="flex flex-1 flex-col relative">
        {/* Top-Left Search (Google Maps style) */}
        <div className="absolute top-4 left-4 z-[5] flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-lg ring-1 ring-slate-900/5 transition-all">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search locations, routes..."
            className="w-64 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
          />
        </div>



        {/* Map Container */}
        <div className="relative flex-1">
          {isClient && (
            <DeckGL
              layers={layers}
              initialViewState={viewState}
              onViewStateChange={(e: { viewState: any }) => setViewState(e.viewState)}
              controller={true}
              getCursor={({ isDragging }: { isDragging: boolean }) => (isDragging ? 'grabbing' : 'grab')}
            >
              <Map
                mapStyle={osmMapStyle as any}
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
                  className="pointer-events-none absolute z-40 rounded-lg bg-white p-3 text-sm shadow-xl ring-1 ring-slate-900/10"
                  style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
                >
                  {hoverInfo.object.properties.cluster ? (
                    <div>
                      <strong>Cluster</strong>
                      <div className="text-muted-foreground">
                        {hoverInfo.object.properties.point_count} evidence points
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-slate-900">{hoverInfo.object.properties.label}</strong>
                      <div className="text-slate-600 mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: getDrugColor(hoverInfo.object.properties.drugCategory) }} />
                        {hoverInfo.object.properties.drugCategory}
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        Risk Score: {hoverInfo.object.properties.riskScore}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DeckGL>
          )}
        </div>

        {/* Timeline / Calendar Panel (Light Glassmorphism Bottom Center) */}
        <div className="absolute bottom-6 left-1/2 z-[5] -translate-x-1/2 rounded-2xl bg-white/80 p-4 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur-xl transition-all hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <div className="w-[600px]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-700">Timeline Filter</span>
                {/* Play/Pause button */}
                <button
                  onClick={isPlaying ? stopPlayback : startPlayback}
                  className={`ml-2 flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                    isPlaying
                      ? "border-blue-500/50 bg-blue-50 text-blue-600 shadow-inner"
                      : "border-slate-200 bg-white text-muted-foreground hover:border-blue-500/30 hover:text-blue-500 shadow-sm"
                  }`}
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-[11px] font-medium text-slate-600">
                  {dateRange[0]}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">to</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-[11px] font-medium text-slate-600">
                  {dateRange[1]}
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
                className="absolute left-0 right-0 top-1 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md"
                style={{ zIndex: 3 }}
                disabled={isPlaying}
              />
              <input
                type="range"
                min={0}
                max={allDateRange.length - 1}
                value={sliderValue[1]}
                onChange={(e) => handleSliderChange(e, "end")}
                className="absolute left-0 right-0 top-1 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md"
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
            <div className="mt-4 border-t border-slate-200/60 pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Filter by Drug Type
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {drugCategories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                      activeCategories.has(cat.name)
                        ? "bg-slate-100 text-slate-800 ring-1 ring-slate-900/5 shadow-sm"
                        : "text-muted-foreground border border-slate-200 bg-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: activeCategories.has(cat.name) ? cat.color : "#cbd5e1" }}
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
