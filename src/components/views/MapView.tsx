"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Filter,
  Layers,
  Search,
  Play,
  Pause,
  Zap,
  ChevronRight,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import Map, { Marker, NavigationControl, FullscreenControl, Popup } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, PathLayer, TextLayer, IconLayer, ArcLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { FlyToInterpolator } from "@deck.gl/core";
import { PathStyleExtension } from "@deck.gl/extensions";
import Supercluster from "supercluster";
import { useDebounce } from "use-debounce";
import { type MapPin } from "@/lib/mockData";
import { getDrugColor } from "@/lib/utils";
import { useMapData } from "@/hooks/useMapData";


import { useAppStore } from "@/lib/store";
import "maplibre-gl/dist/maplibre-gl.css";

const drugCategories = [
  { name: "Opioids/Fentanyl", color: "#FF4500", icon: "💊" },
  { name: "Stimulants", color: "#00FFFF", icon: "⚡" },
  { name: "Cannabis", color: "#39FF14", icon: "🌿" },
  { name: "Psychedelics", color: "#B026FF", icon: "🔮" },
  { name: "Prescription/Other", color: "#FFD700", icon: "💉" },
];

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

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 24, height: 24, mask: true }
};
const MARKER_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 4.5 12 4.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z' fill='white'/%3E%3C/svg%3E";

const INITIAL_VIEW_STATE = {
  longitude: 78.0,
  latitude: 22.0,
  zoom: 4,
  pitch: 0,
  bearing: 0,
  transitionDuration: 0,
};

const MAP_THEMES: Record<string, any> = {
  light: {
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxzoom: 19
      }
    },
    layers: [
      {
        id: "osm-layer",
        type: "raster",
        source: "osm-tiles",
        minzoom: 0,
        maxzoom: 22
      }
    ]
  },
  dark: {
    version: 8,
    sources: {
      "esri-dark": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        attribution: '&copy; Esri',
        maxzoom: 16
      },
      "esri-dark-ref": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        maxzoom: 16
      }
    },
    layers: [
      {
        id: "esri-dark-base",
        type: "raster",
        source: "esri-dark",
        minzoom: 0,
        maxzoom: 22
      },
      {
        id: "esri-dark-labels",
        type: "raster",
        source: "esri-dark-ref",
        minzoom: 0,
        maxzoom: 22
      }
    ]
  },
  voyager: {
    version: 8,
    sources: {
      "esri-topo": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        attribution: '&copy; Esri',
        maxzoom: 18
      }
    },
    layers: [
      {
        id: "esri-topo-layer",
        type: "raster",
        source: "esri-topo",
        minzoom: 0,
        maxzoom: 22
      }
    ]
  }
};

function formatShortDate(isoString: string) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toISOString().split("T")[0];
  } catch (e: any) {
    console.error("Failed to load map data", e);
    return isoString.split("T")[0];
  }
}

export default function MapView() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [debouncedViewState] = useDebounce(viewState, 200);
  
  const [viewMode, setViewMode] = useState<"cluster" | "heatmap">("cluster");
  const [mapTheme, setMapTheme] = useState<"light" | "dark" | "voyager">("light");
  
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const playRef = useRef<NodeJS.Timeout | null>(null);
  
  const [selectedCluster, setSelectedCluster] = useState<{lng: number, lat: number, leaves: any[]} | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Store integration
  const storeSelectedId = useAppStore((s) => s.selectedEntityId);
  const storeSelectedType = useAppStore((s) => s.selectedEntityType);
  const selectEntity = useAppStore((s) => s.selectEntity);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const openDossier = useAppStore((s) => s.openDossier);
  const filters = useAppStore((s) => s.filters);

  const {
    isClient,
    mapPinsData,
    filteredPins,
    supercluster,
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
  } = useMapData(debouncedViewState.zoom, filters.drugCategories, filters.riskRange as [number, number]);

  // Sync store selection into local state
  useEffect(() => {
    if (storeSelectedType === "pin" && storeSelectedId) {
      setSelectedPin(storeSelectedId);
    }
  }, [storeSelectedId, storeSelectedType]);

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
      transitionInterpolator: new FlyToInterpolator(),
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
    setSelectedCluster(null);
    const pin = mapPinsData.find((p) => p.id === pinId);
    if (pin) {
      selectEntity(pinId, "pin", pin.linkedNodeIds);
    }
  }, [selectEntity, mapPinsData]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedPin(null);
    setSelectedCluster(null);
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
  const layers = useMemo(() => {
    const isHeatmap = viewMode === "heatmap";
    const layerList = [];
    
    if (isHeatmap) {
      layerList.push(
        new HeatmapLayer({
          id: "heatmap-layer",
          data: filteredPins,
          getPosition: (d: any) => [d.lng, d.lat],
          getWeight: (d: any) => d.riskScore,
          radiusPixels: 40,
          intensity: 1,
          threshold: 0.05,
          colorRange: [
            [255, 255, 255, 0],
            [13, 148, 136, 100], // Cyan
            [168, 85, 247, 150], // Purple
            [249, 115, 22, 200], // Orange
            [225, 29, 72, 255]   // Red
          ]
        })
      );
    } else {
      layerList.push(
        // Trafficking Route Arcs
        new ArcLayer({
          id: 'arc-layer',
          data: filteredPins.filter((pin: any) => pin.originRoute && pin.originRoute.length > 0),
          getSourcePosition: (d: any) => [d.originRoute[0].lng, d.originRoute[0].lat],
          getTargetPosition: (d: any) => [d.lng, d.lat],
          getSourceColor: (d: any) => cachedHexToRgb(getDrugColor(d.drugCategory), 50),
          getTargetColor: (d: any) => cachedHexToRgb(getDrugColor(d.drugCategory), 200),
          getWidth: 2,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 200],
          onHover: (info: any) => setHoverInfo(info),
        }),
        
        // Teardrop Icon Layer
        new IconLayer({
          id: 'icon-layer',
          data: unclusteredPoints,
          iconAtlas: MARKER_SVG,
          iconMapping: ICON_MAPPING,
          getIcon: () => 'marker',
          getPosition: (d: any) => d.geometry.coordinates,
          getSize: (d: any) => {
             const isSelected = selectedPin === d.properties.id || (storeSelectedType === "pin" && storeSelectedId === d.properties.id);
             return isSelected ? 48 : 36;
          },
          getColor: (d: any) => cachedHexToRgb(getDrugColor(d.properties.drugCategory), 255),
          sizeUnits: 'pixels',
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 150],
          onClick: (info: any) => {
            if (info.object && !info.object.properties.cluster) {
              handlePinClick(info.object.properties.id);
            }
          },
          onHover: (info: any) => setHoverInfo(info),
          updateTriggers: {
            getSize: [selectedPin, storeSelectedId],
          }
        }),
        
        // Glowing cluster background
        new ScatterplotLayer({
          id: "cluster-glow-layer",
          data: clusterNodes,
          getPosition: (d: any) => d.geometry.coordinates,
          getFillColor: [14, 165, 233, 40], // Light cyan glow
          getRadius: (d: any) => Math.min(28 + d.properties.point_count, 45),
          radiusUnits: 'pixels',
          pickable: false,
        }),
        
        // Solid cluster center
        new ScatterplotLayer({
          id: "cluster-scatter-layer",
          data: clusterNodes,
          getPosition: (d: any) => d.geometry.coordinates,
          getFillColor: [15, 23, 42, 230], // Slate-900 transparent
          getLineColor: [14, 165, 233, 255], // Cyan border
          getLineWidth: 2,
          lineWidthUnits: 'pixels',
          getRadius: (d: any) => Math.min(18 + d.properties.point_count, 32),
          radiusUnits: 'pixels',
          pickable: true,
          onClick: (info: any) => {
            if (info.object && info.object.properties.cluster) {
              try {
                // Prevent zooming, instead extract leaves
                const clusterId = info.object.properties.cluster_id;
                const pointCount = info.object.properties.point_count;
                // Get all leaves in the cluster (up to the total count)
                const leaves = supercluster.getLeaves(clusterId, pointCount);
                
                setSelectedPin(null);
                setSelectedCluster({
                  lng: info.object.geometry.coordinates[0],
                  lat: info.object.geometry.coordinates[1],
                  leaves
                });
              } catch (err) {
                console.error("Unable to fetch cluster leaves:", err);
                setToastMessage("Unable to fetch case data");
                setTimeout(() => setToastMessage(null), 3000);
              }
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
          fontWeight: 600,
        })
      );
    }
    
    layerList.push(
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
      })
    );

    return layerList;
  }, [unclusteredPoints, clusterNodes, supercluster, selectedPin, storeSelectedId, storeSelectedType, selectedPinData, handlePinClick, viewMode, filteredPins]);

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

        {/* Top-Right Toggle (Point vs Heatmap & Theme Switcher) */}
        <div className="absolute top-4 right-4 z-[5] flex items-center gap-2">
          {/* Map Base Theme Switcher */}
          <div className="flex items-center gap-1 rounded-lg bg-[#0a0f18]/90 p-1 shadow-lg ring-1 ring-slate-800 backdrop-blur-md">
            <button
              onClick={() => setMapTheme("light")}
              aria-label="Switch to Light Map Mode"
              title="Light Mode (Positron)"
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                mapTheme === "light"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              Light
            </button>
            <button
              onClick={() => setMapTheme("dark")}
              aria-label="Switch to Dark Map Mode"
              title="Dark Mode (Dark Matter)"
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                mapTheme === "dark"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              Dark
            </button>
            <button
              onClick={() => setMapTheme("voyager")}
              aria-label="Switch to Voyager Satellite/Street Map Mode"
              title="Voyager Mode (Detailed Features)"
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                mapTheme === "voyager"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Voyager
            </button>
          </div>

          {/* Visualization Mode (Clusters vs Heatmap) */}
          <div className="flex items-center gap-1 rounded-lg bg-[#0a0f18]/90 p-1 shadow-lg ring-1 ring-slate-800 backdrop-blur-md">
            <button
              onClick={() => setViewMode("cluster")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "cluster" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              Clusters
            </button>
            <button
              onClick={() => setViewMode("heatmap")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "heatmap" ? "bg-orange-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Zap className="h-4 w-4" />
              Heatmap
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1">
          {isClient && (
            <DeckGL
              layers={layers}
              viewState={viewState}
              onViewStateChange={(e: { viewState: any }) => setViewState(e.viewState)}
              controller={true}
              getCursor={({ isDragging, isHovering }: any) => isDragging ? 'grabbing' : (isHovering || hoverInfo?.object) ? 'pointer' : 'grab'}
            >
              <Map
                mapStyle={MAP_THEMES[mapTheme] as any}
                reuseMaps
              >
                <NavigationControl position="bottom-right" />
                <FullscreenControl position="bottom-right" />
                
                {/* CSS Pulsing Marker for Selected Point (Removed as IconLayer now handles it) */}
                
                {/* Interactive Click Popup */}
                {selectedPinData && (
                  <Popup
                    longitude={selectedPinData.lng}
                    latitude={selectedPinData.lat}
                    anchor="bottom"
                    onClose={handleCloseDrawer}
                    closeOnClick={false}
                    className="z-50"
                    offset={40} // Offset above the pin
                    maxWidth="320px"
                  >
                    <div className="bg-[#0a0f18] text-slate-200 border border-slate-700 rounded-lg shadow-2xl p-4 w-72">
                      <div className="flex flex-col mb-3 pb-2 border-b border-slate-700/50">
                        <span className="text-white font-bold text-sm tracking-wide">{selectedPinData.label}</span>
                        <span className="text-xs text-slate-400 mt-1">{selectedPinData.details}</span>
                      </div>
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Category</span>
                          <span className="text-white flex items-center gap-1.5 font-medium">
                            <span className="h-2 w-2 rounded-full" style={{background: getDrugColor(selectedPinData.drugCategory)}}></span>
                            {selectedPinData.drugCategory}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Recorded</span>
                          <span className="text-white font-mono">{selectedPinData.date}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Risk Score</span>
                          <span className={`font-semibold rounded-full px-2 py-0.5 bg-slate-900 ${selectedPinData.riskScore > 75 ? 'text-red-400 border border-red-500/20' : 'text-orange-400 border border-orange-500/20'}`}>
                            {selectedPinData.riskScore}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => openDossier(selectedPinData.entityId || selectedPinData.id)}
                        className="mt-4 w-full rounded-md bg-cyan-600/10 text-cyan-400 py-1.5 text-xs font-semibold hover:bg-cyan-600/20 transition-colors border border-cyan-500/20"
                      >
                        View Full Intel
                      </button>
                    </div>
                  </Popup>
                )}

                {/* Interactive Cluster Popup */}
                {selectedCluster && (
                  <Popup
                    longitude={selectedCluster.lng}
                    latitude={selectedCluster.lat}
                    anchor="bottom"
                    onClose={() => setSelectedCluster(null)}
                    closeOnClick={false}
                    className="z-50"
                    offset={55}
                    maxWidth="320px"
                  >
                    <div className="bg-[#0a0f18] text-slate-200 border border-slate-700 rounded-lg shadow-2xl p-4 w-72 max-h-80 flex flex-col">
                      <div className="mb-3 pb-2 border-b border-slate-700/50 flex justify-between items-center">
                        <span className="text-white font-bold text-sm tracking-wide">Case Detail ({selectedCluster.leaves.length})</span>
                      </div>
                      <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent">
                        {selectedCluster.leaves.map((leaf: any, idx: number) => (
                           <div 
                             key={idx} 
                             onClick={() => openDossier(leaf.properties.entityId || leaf.properties.id)}
                             className="flex flex-col bg-slate-800/40 p-2.5 rounded-md border border-slate-700/50 hover:bg-slate-800/80 hover:border-cyan-500/30 transition-colors cursor-pointer group"
                           >
                             <div className="flex justify-between items-center mb-1.5">
                                <span className="font-mono text-xs text-white font-semibold truncate mr-2 group-hover:text-cyan-400 transition-colors">
                                  {leaf.properties.label || leaf.properties.id}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {leaf.properties.date}
                                  </span>
                                  <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                </div>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full shadow-sm" style={{background: getDrugColor(leaf.properties.drugCategory)}}></span>
                                <span className="text-[10.5px] text-slate-300 font-medium tracking-wide">{leaf.properties.drugCategory}</span>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                )}
              </Map>

              {/* High-performance DeckGL tooltip */}
              {hoverInfo && hoverInfo.object && (
                <div
                  className="pointer-events-none absolute z-40 rounded-lg border border-slate-800 bg-[#0a0f18]/95 p-3 text-sm shadow-xl backdrop-blur-md"
                  style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
                >
                  {hoverInfo.layer.id === 'arc-layer' ? (
                    <div>
                      <strong className="text-white text-xs uppercase tracking-wider text-slate-300 mb-1 block">Trafficking Route</strong>
                      <div className="text-slate-100 mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shadow-sm" style={{ background: getDrugColor(hoverInfo.object.drugCategory) }} />
                        <span className="font-semibold">{hoverInfo.object.confiscatedAmount || hoverInfo.object.details}</span>
                      </div>
                      <div className="text-slate-400 mt-2 text-xs flex justify-between">
                        <span>Origin to {hoverInfo.object.label}</span>
                      </div>
                    </div>
                  ) : hoverInfo.object.properties?.cluster ? (
                    <div>
                      <strong className="text-white">Activity Cluster</strong>
                      <div className="text-slate-300">
                        {hoverInfo.object.properties.point_count} evidence points
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-white">{hoverInfo.object.properties?.label || hoverInfo.object.label}</strong>
                      <div className="text-slate-200 mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shadow-sm" style={{ background: getDrugColor(hoverInfo.object.properties?.drugCategory || hoverInfo.object.drugCategory) }} />
                        <span className="text-xs">{hoverInfo.object.properties?.drugCategory || hoverInfo.object.drugCategory}</span>
                      </div>
                      <div className="text-slate-400 mt-2 text-xs">
                        Risk Score: <span className="font-semibold text-white">{hoverInfo.object.properties?.riskScore || hoverInfo.object.riskScore}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DeckGL>
          )}
          
          {/* Empty State Overlay */}
          {filteredPins.length === 0 && mapPinsData.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="rounded-xl border border-slate-800/80 bg-[#0a0f18]/80 px-6 py-4 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col items-center gap-2">
                  <Filter className="h-6 w-6 text-slate-500" />
                  <span className="text-sm font-medium text-slate-300">No data found for selected timeframe or filters</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Custom Toast Message */}
          {toastMessage && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {toastMessage}
            </div>
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
                  aria-label={isPlaying ? "Pause timeline playback" : "Start timeline playback"}
                  className={`ml-2 flex h-8 w-8 items-center justify-center rounded-full border transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                    isPlaying
                      ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-400 shadow-inner"
                      : "border-slate-700 bg-[#070a10] text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 shadow-sm"
                  }`}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-[#070a10] p-1.5 border border-slate-800">
                <span className="px-2 font-mono text-[11px] font-medium text-slate-200">
                  {formatShortDate(dateRange[0])}
                </span>
                <span className="text-[10px] font-medium text-slate-400">to</span>
                <span className="px-2 font-mono text-[11px] font-medium text-slate-200">
                  {formatShortDate(dateRange[1])}
                </span>
              </div>
            </div>

            {/* Dual Range Slider */}
            <div className="relative h-8">
              <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full bg-slate-800" />
              <div
                className="absolute top-3 h-1.5 rounded-full bg-cyan-500"
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
            <div className="mt-1 flex justify-between text-[9px] font-medium text-slate-400">
              {allDateRange.filter((_, i) => i % Math.max(1, Math.floor(allDateRange.length / 6)) === 0 || i === allDateRange.length - 1).map((date) => (
                <span key={date}>{date.slice(5)}</span>
              ))}
            </div>

            {/* Drug Filters */}
            <div className="mt-5 border-t border-slate-800/60 pt-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Filter by Drug Type
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {drugCategories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    style={activeCategories.has(cat.name) ? { borderColor: cat.color, boxShadow: `0 0 10px ${cat.color}40` } : {}}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-300 ${
                      activeCategories.has(cat.name)
                        ? "bg-[#070a10] text-white ring-1 ring-white/10"
                        : "text-slate-300 border border-slate-700 bg-transparent opacity-60 hover:opacity-100 hover:bg-slate-800/50 hover:text-slate-100"
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
    </div>
  );
}
