"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Activity, Radio, Database, MapPin as MapPinIcon, ShieldAlert, Copy, Check } from "lucide-react";
import Map, { Marker } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import { PathStyleExtension } from "@deck.gl/extensions";
import { trackerData, type TrackerEntity } from "@/lib/trackerData";
import { FlyToInterpolator } from "@deck.gl/core";
import { getDrugColor } from "@/lib/utils";
import "maplibre-gl/dist/maplibre-gl.css";

const lightMapStyle = {
  version: 8 as const,
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
};

interface Hop {
  name: string;
  lat: number;
  lng: number;
}

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  transitionInterpolator?: any;
}

export default function MovementTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<TrackerEntity | null>(null);
  const [syntheticHops, setSyntheticHops] = useState<Hop[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  
  const [viewState, setViewState] = useState<MapViewState>({
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
      transitionInterpolator: new FlyToInterpolator(),
    });
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "bg-red-500/20 text-red-400 border border-red-500/30";
    if (risk >= 40) return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
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
              className="w-full bg-slate-900 border border-slate-800 rounded-md py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredData.map((entity) => (
            <div
              key={entity.id}
              onClick={() => handleSelectEntity(entity)}
              className={`p-4 border-b border-border/50 cursor-pointer transition-all ${
                selectedEntity?.id === entity.id ? "bg-slate-800/70 border-l-4 shadow-inner" : "hover:bg-slate-800/30 border-l-4 border-l-transparent"
              }`}
              style={{ borderLeftColor: selectedEntity?.id === entity.id ? getDrugColor(entity.category) : "transparent" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs" style={{ color: getDrugColor(entity.category) }}>
                    {entity.alias.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{entity.alias}</h3>
                    <p className="text-[10px] text-muted-foreground">{entity.id}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ${getRiskColor(entity.risk)}`}>
                    RISK: {entity.risk}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPinIcon className="h-3 w-3 text-slate-500" />
                  <span className="truncate">{entity.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Database className="h-3 w-3 text-slate-500" />
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
        <div className="flex-1 relative bg-[#0B0F19]">
          {isClient && (
            <DeckGL
              layers={layers}
              viewState={viewState}
              onViewStateChange={(e: { viewState: any }) => setViewState(e.viewState)}
              controller={true}
            >
              <Map mapStyle={lightMapStyle as any} reuseMaps>
                {/* Pulse Animation for Last Known Physical Node */}
                {syntheticHops.length > 0 && (
                  <Marker longitude={syntheticHops[2].lng} latitude={syntheticHops[2].lat}>
                    <div className="relative flex h-8 w-8 items-center justify-center -translate-x-1/2 -translate-y-1/2">
                      <span 
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                        style={{ backgroundColor: getDrugColor(selectedEntity!.category) }}
                      />
                      <span 
                        className="relative inline-flex h-3 w-3 rounded-full"
                        style={{ backgroundColor: getDrugColor(selectedEntity!.category), boxShadow: `0 0 10px ${getDrugColor(selectedEntity!.category)}` }}
                      />
                    </div>
                  </Marker>
                )}
              </Map>
            </DeckGL>
          )}

          {/* Map Overlay Header */}
          {selectedEntity && (
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
              <div className="bg-slate-900/80 border border-slate-700 p-4 rounded shadow-2xl backdrop-blur-md pointer-events-auto min-w-[280px]">
                <div className="text-[9px] text-muted-foreground mb-1 tracking-widest font-bold">TRACKING ACTIVE TARGET</div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  {selectedEntity.alias}
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getDrugColor(selectedEntity.category), boxShadow: `0 0 8px ${getDrugColor(selectedEntity.category)}` }}></div>
                </h1>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">LAST PING: {new Date(selectedEntity.date).toLocaleString()}</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-700 p-4 rounded shadow-2xl backdrop-blur-md flex gap-8 text-xs pointer-events-auto">
                <div>
                  <div className="text-[9px] font-bold text-muted-foreground mb-1 tracking-widest">CATEGORY</div>
                  <div className="font-semibold" style={{ color: getDrugColor(selectedEntity.category) }}>{selectedEntity.category}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-muted-foreground mb-1 tracking-widest">STATUS</div>
                  <div className="text-slate-200 font-semibold">{selectedEntity.status}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-muted-foreground mb-1 tracking-widest">PLATFORM</div>
                  <div className="text-slate-200 font-semibold">{selectedEntity.platform}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel: Entity Overview */}
        {selectedEntity ? (
          <div className="h-64 border-t border-border bg-[#0B0F19] p-4 flex gap-4 overflow-x-auto">
            <div className="flex-1 min-w-[300px] bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col relative overflow-hidden">
              <h3 className="text-[10px] font-bold text-muted-foreground mb-4 flex items-center gap-2 tracking-widest uppercase">
                <ShieldAlert className="h-4 w-4 text-slate-400" /> EVIDENCE RECORD
              </h3>
              <div className="absolute top-5 right-5 flex gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[8px] text-slate-400 border border-slate-700">OSINT</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[8px] text-slate-400 border border-slate-700">SIGINT</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">{selectedEntity.evidence}</p>
              <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-500">
                <span>LOGGED: {new Date().toLocaleTimeString()}</span>
                <span>ID: {selectedEntity.id.split('-')[1]}</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-[300px] bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col relative">
              <h3 className="text-[10px] font-bold text-muted-foreground mb-4 flex items-center gap-2 tracking-widest uppercase">
                <Radio className="h-4 w-4 text-slate-400" /> DIGITAL FOOTPRINT
              </h3>
              
              <div className="absolute top-5 right-5 flex items-end gap-0.5 h-6">
                {/* Mock Sparkline Graph */}
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1 bg-cyan-500/50 rounded-t-sm" style={{ height: `${20 + Math.random() * 80}%` }} />
                ))}
              </div>

              <div className="grid grid-cols-[100px_1fr] gap-y-3 text-xs flex-1 items-center">
                <span className="text-[10px] font-bold tracking-widest text-slate-500">WALLET</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-cyan-400 truncate bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 font-mono text-[11px] flex-1">
                    {selectedEntity.wallet}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedEntity.wallet, "wallet")}
                    aria-label="Copy wallet address"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-primary shrink-0"
                    title="Copy wallet address"
                  >
                    {copiedField === "wallet" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                
                <span className="text-[10px] font-bold tracking-widest text-slate-500">PGP FINGER</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-emerald-400 truncate bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-mono text-[11px] flex-1">
                    {selectedEntity.pgp}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedEntity.pgp, "pgp")}
                    aria-label="Copy PGP fingerprint"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-primary shrink-0"
                    title="Copy PGP fingerprint"
                  >
                    {copiedField === "pgp" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                
                <span className="text-[10px] font-bold tracking-widest text-slate-500">COMMS</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-purple-400 truncate bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 font-mono text-[11px] flex-1">
                    {selectedEntity.comms}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedEntity.comms, "comms")}
                    aria-label="Copy communications handle"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-primary shrink-0"
                    title="Copy handle"
                  >
                    {copiedField === "comms" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[300px] bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col">
              <h3 className="text-[10px] font-bold text-muted-foreground mb-4 flex items-center gap-2 tracking-widest uppercase">
                <Activity className="h-4 w-4 text-slate-400" /> RECENT HOPS
              </h3>
              <div className="flex flex-col gap-3 flex-1 justify-center">
                {syntheticHops.map((hop, i) => (
                  <div key={i} className="flex items-center text-xs w-full">
                    <span className="text-slate-300 font-semibold whitespace-nowrap">{hop.name}</span>
                    <div className="flex-grow mx-3 border-b border-dotted border-slate-700/70 relative top-[4px]"></div>
                    <span className="text-slate-500 font-mono whitespace-nowrap tracking-tight">{hop.lat.toFixed(4)}, {hop.lng.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 border-t border-border bg-[#0B0F19] flex items-center justify-center text-slate-500 text-sm">
            Select a target from the roster to view their intelligence dossier and movement pattern.
          </div>
        )}
      </div>
    </div>
  );
}
