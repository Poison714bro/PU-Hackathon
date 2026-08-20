"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Activity, Radio, Database, MapPin as MapPinIcon, ShieldAlert } from "lucide-react";
import Map, { Marker } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import { PathStyleExtension } from "@deck.gl/extensions";
import { trackerData, type TrackerEntity } from "@/lib/trackerData";
import { getDrugColor } from "@/lib/utils";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface Hop {
  name: string;
  lat: number;
  lng: number;
}

export default function MovementTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<TrackerEntity | null>(null);
  const [syntheticHops, setSyntheticHops] = useState<Hop[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  const [viewState, setViewState] = useState({
    longitude: -40.0,
    latitude: 35.0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
    transitionDuration: 1000,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredData = useMemo(() => {
    return trackerData.filter(
      (e) =>
        e.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectEntity = (entity: TrackerEntity) => {
    setSelectedEntity(entity);
    
    // Generate synthetic hops to visualize movement
    const hops = [
      { name: "Origin (VPN/Tor)", lat: entity.lat + (Math.random() * 15 - 7), lng: entity.lng + (Math.random() * 20 - 10) },
      { name: "Transit Server", lat: entity.lat + (Math.random() * 5 - 2.5), lng: entity.lng + (Math.random() * 5 - 2.5) },
      { name: "Last Known Physical", lat: entity.lat, lng: entity.lng }
    ];
    setSyntheticHops(hops);

    setViewState({
      ...viewState,
      longitude: entity.lng,
      latitude: entity.lat,
      zoom: 4,
      transitionDuration: 1500,
    });
  };

  const layers = [
    new PathLayer({
      id: "movement-path-layer",
      data: syntheticHops.length > 0 ? [{ path: syntheticHops.map(h => [h.lng, h.lat]) }] : [],
      getPath: (d: any) => d.path,
      getColor: (d: any) => {
        const hex = selectedEntity ? getDrugColor(selectedEntity.category) : "#ffffff";
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 200];
      },
      getWidth: 4,
      widthUnits: 'pixels',
      dashJustified: true,
      getDashArray: [4, 2],
      extensions: [new PathStyleExtension({dash: true})],
    }),
    new ScatterplotLayer({
      id: "hops-scatter-layer",
      data: syntheticHops,
      getPosition: (d: any) => [d.lng, d.lat],
      getFillColor: [30, 41, 59, 255],
      getLineColor: (d: any) => {
        const hex = selectedEntity ? getDrugColor(selectedEntity.category) : "#ffffff";
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 255];
      },
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      getRadius: (d: any, context: any) => context.index === syntheticHops.length - 1 ? 8 : 5,
      radiusUnits: 'pixels',
      pickable: true,
    }),
    new TextLayer({
      id: "hops-text-layer",
      data: syntheticHops,
      getPosition: (d: any) => [d.lng, d.lat],
      getText: (d: any) => d.name,
      getSize: 12,
      getColor: [255, 255, 255, 200],
      getAlignmentBaseline: "bottom",
      getPixelOffset: [0, -15],
      fontFamily: "monospace"
    })
  ];

  return (
    <div className="flex h-full w-full bg-card text-foreground font-mono overflow-hidden">
      
      {/* LEFT SIDEBAR: Global Target Roster */}
      <div className="w-96 flex flex-col border-r border-border bg-card shadow-2xl z-10">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-slate-100 mb-3 tracking-widest uppercase">Global Target Roster</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search suspect, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-md py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredData.map((entity) => (
            <div
              key={entity.id}
              onClick={() => handleSelectEntity(entity)}
              className={`p-4 border-b border-border/50 cursor-pointer transition-all ${
                selectedEntity?.id === entity.id ? "bg-slate-800/40 border-l-2" : "hover:bg-slate-800/20 border-l-2 border-l-transparent"
              }`}
              style={{ borderLeftColor: selectedEntity?.id === entity.id ? getDrugColor(entity.category) : "transparent" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-card border border-slate-700 flex items-center justify-center font-bold text-xs" style={{ color: getDrugColor(entity.category) }}>
                    {entity.alias.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{entity.alias}</h3>
                    <p className="text-[10px] text-muted-foreground">{entity.id}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-muted-foreground font-bold">
                    RISK: {entity.risk}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPinIcon className="h-3 w-3" />
                  <span className="truncate">{entity.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Database className="h-3 w-3" />
                  <span className="truncate">{entity.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN STAGE: Map & Overview */}
      <div className="flex-1 flex flex-col relative">
        {/* Geospatial Canvas */}
        <div className="flex-1 relative bg-black">
          {isClient && (
            <DeckGL
              layers={layers}
              initialViewState={viewState}
              onViewStateChange={(e: { viewState: any }) => setViewState(e.viewState)}
              controller={true}
            >
              <Map mapStyle={MAP_STYLE} reuseMaps />
            </DeckGL>
          )}

          {/* Map Overlay Header */}
          {selectedEntity && (
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
              <div className="bg-card/90 border border-border p-4 rounded shadow-2xl backdrop-blur-md pointer-events-auto">
                <div className="text-[10px] text-muted-foreground mb-1">TRACKING ACTIVE TARGET</div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  {selectedEntity.alias}
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getDrugColor(selectedEntity.category) }}></div>
                </h1>
                <p className="text-xs text-muted-foreground mt-1 uppercase">LAST PING: {new Date(selectedEntity.date).toLocaleString()}</p>
              </div>
              <div className="bg-card/90 border border-border p-4 rounded shadow-2xl backdrop-blur-md flex gap-6 text-xs pointer-events-auto">
                <div>
                  <div className="text-muted-foreground mb-1">CATEGORY</div>
                  <div style={{ color: getDrugColor(selectedEntity.category) }}>{selectedEntity.category}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">STATUS</div>
                  <div className="text-foreground">{selectedEntity.status}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">PLATFORM</div>
                  <div className="text-foreground">{selectedEntity.platform}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel: Entity Overview */}
        {selectedEntity ? (
          <div className="h-64 border-t border-border bg-card p-4 flex gap-6 overflow-x-auto">
            <div className="flex-1 min-w-[300px] bg-card border border-border rounded p-4">
              <h3 className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> EVIDENCE RECORD
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{selectedEntity.evidence}</p>
            </div>
            
            <div className="flex-1 min-w-[300px] bg-card border border-border rounded p-4">
              <h3 className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <Radio className="h-4 w-4" /> DIGITAL FOOTPRINT
              </h3>
              <div className="grid grid-cols-[100px_1fr] gap-y-3 text-xs">
                <span className="text-slate-600">WALLET:</span>
                <span className="text-blue-400 truncate">{selectedEntity.wallet}</span>
                
                <span className="text-slate-600">PGP FINGER:</span>
                <span className="text-emerald-400 truncate">{selectedEntity.pgp}</span>
                
                <span className="text-slate-600">COMMS:</span>
                <span className="text-purple-400 truncate">{selectedEntity.comms}</span>
              </div>
            </div>

            <div className="flex-1 min-w-[300px] bg-card border border-border rounded p-4">
              <h3 className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" /> RECENT HOPS
              </h3>
              <div className="flex flex-col gap-2">
                {syntheticHops.map((hop, i) => (
                  <div key={i} className="flex justify-between text-xs border-b border-border/50 pb-2">
                    <span className="text-foreground">{hop.name}</span>
                    <span className="text-muted-foreground">{hop.lat.toFixed(4)}, {hop.lng.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 border-t border-border bg-card flex items-center justify-center text-slate-600 text-sm">
            Select a target from the roster to view their intelligence dossier and movement pattern.
          </div>
        )}
      </div>
    </div>
  );
}
