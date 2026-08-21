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
  description?: string;
}

export default function MovementTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const defaultEntity = trackerData[0];
  const [selectedEntity, setSelectedEntity] = useState<TrackerEntity | null>(defaultEntity);
  const [syntheticHops, setSyntheticHops] = useState<Hop[]>([
    { name: "Origin (VPN/Tor)", lat: defaultEntity.lat + 0.05, lng: defaultEntity.lng - 0.06, description: "Encrypted exit node near Bogota" },
    { name: "Transit Server", lat: defaultEntity.lat + 0.02, lng: defaultEntity.lng - 0.02, description: "Miami IX Peering Hub" },
    { name: "Last Known Physical", lat: defaultEntity.lat, lng: defaultEntity.lng, description: "Confirmed MAC via Stingray" }
  ]);
  const [isClient, setIsClient] = useState(false);
  
  const [viewState, setViewState] = useState({
    longitude: defaultEntity.lng,
    latitude: defaultEntity.lat,
    zoom: 11.5,
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
      { name: "Origin (VPN/Tor)", lat: entity.lat + 0.05, lng: entity.lng - 0.06, description: "Encrypted exit node" },
      { name: "Transit Server", lat: entity.lat + 0.02, lng: entity.lng - 0.02, description: "Peering Hub" },
      { name: "Last Known Physical", lat: entity.lat, lng: entity.lng, description: "Confirmed MAC via Stingray" }
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

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "bg-red-600 text-white border border-red-400";
    if (risk >= 40) return "bg-orange-500 text-white border border-orange-400";
    return "bg-emerald-600 text-white border border-emerald-400";
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
                selectedEntity?.id === entity.id ? "bg-slate-700/60 border-l-4 shadow-inner" : "hover:bg-slate-800/30 border-l-4 border-l-transparent"
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
              initialViewState={viewState}
              onViewStateChange={(e: { viewState: any }) => setViewState(e.viewState)}
              controller={true}
            >
              <Map mapStyle={MAP_STYLE} reuseMaps style={{ opacity: 0.4 }}>
                {/* Pulse Animation for Last Known Physical Node */}
                {syntheticHops.length > 0 && (
                  <Marker longitude={syntheticHops[2].lng} latitude={syntheticHops[2].lat}>
                    <div className="relative flex h-32 w-32 items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      {/* Concentric Radar Rings */}
                      <span className="absolute h-[25%] w-[25%] animate-ping rounded-full opacity-60 border-2" style={{ borderColor: '#f97316' }} />
                      <span className="absolute h-[50%] w-[50%] animate-ping rounded-full opacity-40 border-2" style={{ borderColor: '#f97316', animationDelay: '0.3s' }} />
                      <span className="absolute h-[75%] w-[75%] animate-ping rounded-full opacity-20 border-2" style={{ borderColor: '#f97316', animationDelay: '0.6s' }} />
                      <span className="absolute h-[100%] w-[100%] rounded-full opacity-10 bg-orange-500 animate-pulse" />
                      
                      {/* Core Node */}
                      <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white" style={{ backgroundColor: '#f97316', boxShadow: `0 0 20px 4px #f97316` }} />
                      
                      {/* Floating UI Tooltip */}
                      <div className="absolute top-20 left-16 bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-lg shadow-2xl shadow-orange-500/20 w-48 text-left z-50 pointer-events-none">
                        <div className="text-[9px] text-slate-400 font-bold tracking-widest mb-1.5 flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3 text-orange-400" />
                          EST. ADDRESS
                        </div>
                        <div className="text-[11px] font-semibold text-slate-200 leading-tight">123 NW 1st Ave, Miami, FL 33132</div>
                        <div className="mt-2 text-[9px] font-bold tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/30 px-1.5 py-1 rounded inline-block">CONFIDENCE: 92%</div>
                      </div>
                    </div>
                  </Marker>
                )}
              </Map>
            </DeckGL>
          )}

          {/* Map Overlay Header */}
          {selectedEntity && (
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
              <div className="bg-slate-900/80 border border-slate-700 p-4 rounded shadow-2xl backdrop-blur-md pointer-events-auto min-w-[350px] flex justify-between gap-6">
                <div>
                  <div className="text-[9px] text-muted-foreground mb-1 tracking-widest font-bold">TRACKING ACTIVE TARGET</div>
                  <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 whitespace-nowrap">
                    {selectedEntity.alias}
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getDrugColor(selectedEntity.category), boxShadow: `0 0 8px ${getDrugColor(selectedEntity.category)}` }}></div>
                  </h1>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">LAST PING: {new Date(selectedEntity.date).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end w-32 border-l border-slate-700/50 pl-4">
                  <div className="text-[8px] text-slate-500 tracking-widest font-bold mb-1 flex items-center gap-1"><Activity className="h-2 w-2" /> NETWORK PACKET ANALYSIS</div>
                  <div className="w-full h-8 mt-auto opacity-70 flex items-end">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                      <path d="M0,30 L10,15 L20,35 L30,5 L40,25 L50,10 L60,30 L70,15 L80,35 L90,10 L100,20" fill="none" stroke="#22d3ee" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                      <path d="M0,40 L0,30 L10,15 L20,35 L30,5 L40,25 L50,10 L60,30 L70,15 L80,35 L90,10 L100,20 L100,40 Z" fill="url(#grad)" stroke="none" />
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
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
              
              <div className="mt-auto pt-4 flex justify-center">
                <div className="relative w-full max-w-[240px] rounded overflow-hidden border border-slate-700/50 shadow-inner group cursor-pointer bg-black/50 p-1">
                  <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-transparent transition-colors z-10 mix-blend-color pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 bg-slate-900/90 text-[8px] text-slate-400 p-1 text-center font-bold tracking-widest border-b border-slate-700/50 z-20 pointer-events-none">CRYPTO-ESCROW LEDGER</div>
                  <img src="/crypto_ledger.jpg" alt="Escrow Ledger" className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-500">
                <span>LOGGED: {new Date().toLocaleTimeString()}</span>
                <span>ID: {selectedEntity.id.split('-')[1]}</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-[300px] bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col relative">
              <h3 className="text-[10px] font-bold text-muted-foreground mb-4 flex items-center gap-2 tracking-widest uppercase">
                <Radio className="h-4 w-4 text-slate-400" /> DIGITAL FOOTPRINT
              </h3>
              
              <div className="absolute top-5 right-5 flex flex-col items-end">
                <div className="flex items-end gap-0.5 h-6 mb-1">
                  {/* Mock Sparkline Graph */}
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-1 bg-cyan-500/50 rounded-t-sm" style={{ height: `${20 + Math.random() * 80}%` }} />
                  ))}
                </div>
                <span className="text-[7px] text-slate-500 uppercase tracking-widest">24H COMMS</span>
              </div>

              <div className="flex-1 mt-4 relative w-full h-full min-h-[140px]">
                <svg className="absolute inset-0 w-full h-full" overflow="visible">
                  {/* Edges */}
                  <line x1="30%" y1="20%" x2="70%" y2="50%" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 2" />
                  <line x1="30%" y1="80%" x2="70%" y2="50%" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.4" />
                  <line x1="70%" y1="50%" x2="85%" y2="30%" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
                  <line x1="70%" y1="50%" x2="85%" y2="70%" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
                  
                  {/* Wallet Node */}
                  <g transform="translate(calc(30% - 40px), calc(20% - 10px))">
                    <rect width="80" height="20" rx="4" fill="#0f172a" stroke="#22d3ee" strokeOpacity="0.5" />
                    <circle cx="-10" cy="10" r="4" fill="#22d3ee" />
                    <text x="40" y="14" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="monospace">{selectedEntity.wallet.substring(0, 12)}</text>
                  </g>
                  <text x="30%" y="8%" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">WALLET</text>

                  {/* Comms Node */}
                  <g transform="translate(calc(30% - 40px), calc(80% - 10px))">
                    <rect width="80" height="20" rx="4" fill="#0f172a" stroke="#a855f7" strokeOpacity="0.5" />
                    <circle cx="-10" cy="10" r="4" fill="#a855f7" />
                    <text x="40" y="14" textAnchor="middle" fill="#a855f7" fontSize="9" fontFamily="monospace">{selectedEntity.comms.substring(0, 12)}</text>
                  </g>
                  <text x="30%" y="98%" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">COMMS</text>

                  {/* PGP Node (Central) */}
                  <g transform="translate(calc(70% - 60px), calc(50% - 14px))">
                    <rect width="120" height="28" rx="6" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeOpacity="0.6" />
                    <text x="60" y="18" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">{selectedEntity.pgp.substring(0, 16)}</text>
                  </g>
                  <text x="70%" y="35%" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">PGP FINGERPRINT</text>

                  {/* Sub-nodes */}
                  <g transform="translate(calc(85% - 20px), calc(30% - 8px))">
                    <rect width="40" height="16" rx="3" fill="#0f172a" stroke="#10b981" strokeOpacity="0.4" />
                    <text x="20" y="11" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">WDP ID</text>
                  </g>
                  <g transform="translate(calc(85% - 20px), calc(70% - 8px))">
                    <rect width="40" height="16" rx="3" fill="#0f172a" stroke="#10b981" strokeOpacity="0.4" />
                    <text x="20" y="11" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">PGP ID</text>
                  </g>
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-[300px] bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col">
              <h3 className="text-[10px] font-bold text-muted-foreground mb-4 flex items-center gap-2 tracking-widest uppercase">
                <Activity className="h-4 w-4 text-slate-400" /> RECENT HOPS
              </h3>
              <div className="flex flex-col gap-3 flex-1 justify-center">
                {syntheticHops.map((hop, i) => (
                  <div key={i} className="flex flex-col w-full mb-1">
                    <div className="flex items-end text-xs w-full gap-2">
                      <span className="text-slate-300 font-semibold whitespace-nowrap">{hop.name}</span>
                      {hop.name.includes("Transit") && (
                        <div className="relative h-3 w-3 mr-1 mb-0.5 flex items-center justify-center">
                           <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 bg-yellow-400"></span>
                           <svg className="w-3 h-3 text-yellow-300 relative drop-shadow-[0_0_3px_rgba(253,224,71,0.8)]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        </div>
                      )}
                      <div className="flex-grow border-b-2 border-dotted border-slate-600/50 mb-1"></div>
                      <span className="text-slate-400 font-mono whitespace-nowrap tracking-tight">{hop.lat.toFixed(4)}, {hop.lng.toFixed(4)}</span>
                    </div>
                    {hop.description && (
                      <span className="text-[10px] text-slate-500 font-medium italic mt-1">{hop.description}</span>
                    )}
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
