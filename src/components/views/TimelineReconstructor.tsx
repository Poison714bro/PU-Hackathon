"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { 
  Search, 
  Activity, 
  ShieldAlert, 
  Bitcoin, 
  Fingerprint, 
  ExternalLink,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Brush,
  ReferenceDot,
  ReferenceLine
} from "recharts";
import { useSearchParams } from "next/navigation";

import {
  GraphDataPoint,
  TimelineEvent,
  EVENT_CONFIG,
  getUnifiedGraphData,
  getTimelineEventsWithCoords,
  getActiveGraphData,
  getActiveTimelineEvents,
  type TimelineEventType,
} from "@/lib/timelineData";

// ── Custom ReferenceDot that renders the glowing target pin ──
const GlowDot = (props: { cx?: number; cy?: number; payload?: { type: string } }) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  const config = EVENT_CONFIG[payload.type as TimelineEventType];
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="none" stroke={config.hex} strokeWidth={1} opacity={0.25} />
      <circle cx={cx} cy={cy} r={6} fill="#0d131f" stroke={config.hex} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2.5} fill={config.hex} />
    </g>
  );
};


export default function TimelineReconstructor() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  const [dossierData, setDossierData] = useState<{ entityId: string; primaryAlias: string; riskScore: number; status: string; financialProfile: { totalVolumeUSD: number; peakOperationPeriod: string; genesisDate: string; coinJoinRounds: number; }; } | null>(null);

  // Memoize unified graph data
  const unifiedGraphData = useMemo(() => getUnifiedGraphData(), []);
  const timelineEventsWithCoords = useMemo(() => getTimelineEventsWithCoords(unifiedGraphData), [unifiedGraphData]);

  // Initialize brush range from URL params
  const initialStartIndex = searchParams.get('startIndex') ? parseInt(searchParams.get('startIndex')!) : 0;
  const initialEndIndex = searchParams.get('endIndex') ? parseInt(searchParams.get('endIndex')!) : unifiedGraphData.length - 1;

  // Brush state
  const [brushRange, setBrushRange] = useState<{ startIndex?: number, endIndex?: number }>({
    startIndex: initialStartIndex,
    endIndex: initialEndIndex
  });

  // Sync brush range to URL
  useEffect(() => {
    if (brushRange.startIndex !== undefined && brushRange.endIndex !== undefined) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('startIndex', brushRange.startIndex.toString());
      params.set('endIndex', brushRange.endIndex.toString());
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [brushRange, searchParams]);

  // Drawer state
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  
  // Hover state for cards
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  
  // Chart ref for pixel coordinate mapping
  const chartRef = useRef<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasResults(false);
    setSearchStep(1);

    // Simulate multi-step loading visually
    const t1 = setTimeout(() => setSearchStep(2), 1200); // Scraping Archives
    const t2 = setTimeout(() => setSearchStep(3), 2500); // Running Stylometry
    const t3 = setTimeout(() => setSearchStep(4), 3800); // Reconstructing

    try {
      const apiSecret = process.env.NEXT_PUBLIC_API_SECRET_KEY;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiSecret && process.env.NEXT_PUBLIC_ENABLE_API_AUTH === 'true') {
        headers['Authorization'] = `Bearer ${apiSecret}`;
      }
      
      const res = await fetch('/api/reconstruct', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (data && !data.error) {
        setDossierData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      // Ensure minimum UI loading time for visual effect
      setTimeout(() => {
        setIsSearching(false);
        setHasResults(true);
        setBrushRange({ startIndex: 0, endIndex: unifiedGraphData.length - 1 });
      }, Math.max(0, 4500));
    }
  };

  const activeGraphData = useMemo(() => {
    if (!hasResults || brushRange.startIndex === undefined || brushRange.endIndex === undefined) return unifiedGraphData;
    return getActiveGraphData(unifiedGraphData, brushRange);
  }, [hasResults, brushRange, unifiedGraphData]);

  const activeTimelineEvents = useMemo(() => {
    if (!hasResults || activeGraphData.length === 0) return [];
    return getActiveTimelineEvents(timelineEventsWithCoords, activeGraphData, brushRange);
  }, [hasResults, activeGraphData, brushRange, timelineEventsWithCoords]);

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden bg-background text-foreground hide-scrollbar scroll-smooth">
      
      {/* Search Header */}
      <div className="z-20 border-b border-border bg-background/95 px-8 py-6 backdrop-blur-md sticky top-0 shrink-0">
        <form onSubmit={handleSearch} className="mx-auto max-w-4xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Alias, BTC Wallet, PGP Key, or Session ID to reconstruct timeline..."
              className="w-full rounded-xl border border-border bg-card py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-zinc-500 shadow-inner focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-[#070a10] transition-all hover:bg-cyan-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
            >
              Reconstruct
            </button>
          </div>
        </form>

        {/* Loading Sequence */}
        <AnimatePresence>
          {isSearching && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-center space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm font-semibold text-primary">
                  {searchStep === 1 && "Querying Blockchain ledgers..."}
                  {searchStep === 2 && "Scraping Forum Archives & Darknet indices..."}
                  {searchStep === 3 && "Running Stylometry & NLP Analysis..."}
                  {searchStep === 4 && "Reconstructing Chronological Timeline..."}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(searchStep / 4) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Card Summary */}
        <AnimatePresence>
          {hasResults && !isSearching && dossierData && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-6 grid max-w-4xl grid-cols-4 gap-4 rounded-xl border border-border bg-card p-4 shadow-lg"
            >
              <div className="flex flex-col border-r border-border px-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Genesis Date</span>
                <span className="text-lg font-bold text-white">{dossierData.financialProfile?.genesisDate || 'Unknown'}</span>
              </div>
              <div className="flex flex-col border-r border-border px-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Peak Operation</span>
                <span className="text-lg font-bold text-[#10b981]">{dossierData.financialProfile?.peakOperationPeriod || 'Unknown'}</span>
              </div>
              <div className="flex flex-col border-r border-border px-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Est. Volume</span>
                <span className="text-lg font-bold text-[#10b981]">${dossierData.financialProfile?.totalVolumeUSD?.toLocaleString() || 0}</span>
              </div>
              <div className="flex flex-col px-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Current Status</span>
                <span className={`text-lg font-bold ${dossierData.status === 'Seized' ? 'text-red-500' : 'text-destructive'}`}>{dossierData.status}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasResults && (
        <div className="flex-1 w-full relative">
          {/* ═══ Milestone Cards — positioned ABOVE the chart in the safe-zone ═══ */}
          <div className="w-full px-6 pt-6 pb-2">
            <div className="flex items-end gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {activeTimelineEvents.map((evt) => {
                const config = EVENT_CONFIG[evt.type];
                const Icon = config.icon;
                const isHovered = hoveredCardId === evt.id;
                return (
                  <div
                    key={evt.id}
                    onMouseEnter={() => setHoveredCardId(evt.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    onClick={() => setSelectedEvent(evt)}
                    className="shrink-0 cursor-pointer transition-all duration-200"
                    style={{
                      opacity: isHovered ? 1 : 0.7,
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <div
                      className="w-[220px] rounded-lg border bg-card/80 backdrop-blur-md p-3 shadow-xl transition-all duration-200"
                      style={{
                        borderColor: isHovered ? config.hex : '#334155',
                        borderTopWidth: '2px',
                        borderTopColor: config.hex,
                      }}
                    >
                      {/* Header: Title + Date — Flexbox anti-collision */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${config.color}`} />
                          <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider truncate">
                            {evt.title}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-zinc-500 shrink-0 whitespace-nowrap">
                          {evt.dateStr}
                        </span>
                      </div>
                      
                      {/* Description — clamped to 2 lines */}
                      <p className="text-[10px] leading-[1.4] text-zinc-400 line-clamp-2 mb-2">
                        {evt.summary}
                      </p>
                      
                      {/* Footer action */}
                      <button
                        className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors hover:text-white ${config.color}`}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Expand Evidence
                      </button>
                    </div>
                    
                    {/* Mini stem indicator below card */}
                    <div className="flex justify-center">
                      <div 
                        className="w-px h-3 transition-all duration-200" 
                        style={{ 
                          backgroundColor: isHovered ? config.hex : '#334155',
                          opacity: isHovered ? 1 : 0.5
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ Unified Canvas Graph ═══ */}
          <div className="w-full h-[500px] bg-background px-6 pb-16">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                ref={chartRef}
                margin={{ top: 30, right: 30, left: 20, bottom: 40 }}
              >
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                
                <XAxis 
                  dataKey="timestamp" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(ts) => {
                    const date = new Date(ts);
                    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
                  }}
                  stroke="#4b5563" 
                  fontSize={11} 
                  tickMargin={15} 
                  allowDataOverflow
                />
                
                <YAxis yAxisId="left" stroke="#10b981" fontSize={11} tickFormatter={(val) => `$${val/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#00ffff" fontSize={11} />
                
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f2937', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelFormatter={(ts) => new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                  labelStyle={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}
                />

                <Area 
                  data={unifiedGraphData}
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                  name="Operational Volume (USD)" 
                />
                
                <Line 
                  data={unifiedGraphData}
                  yAxisId="right" 
                  type="step" 
                  dataKey="posts" 
                  stroke="#00ffff" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false} 
                  name="Active Listings" 
                />
                
                {/* ── Leader Lines: vertical dashed stems from top of chart to curve ── */}
                {activeTimelineEvents.map((evt) => {
                  const config = EVENT_CONFIG[evt.type];
                  const isHovered = hoveredCardId === evt.id;
                  return (
                    <ReferenceLine
                      key={`stem-${evt.id}`}
                      yAxisId="left"
                      x={evt.timestamp}
                      stroke={config.hex}
                      strokeWidth={isHovered ? 1.5 : 1}
                      strokeDasharray={isHovered ? "0" : "3 3"}
                      strokeOpacity={isHovered ? 0.8 : 0.25}
                    />
                  );
                })}

                {/* ── Glowing Target Dots anchored to the curve ── */}
                {activeTimelineEvents.map((evt) => (
                  <ReferenceDot
                    key={`dot-${evt.id}`}
                    yAxisId="left"
                    x={evt.timestamp}
                    y={evt.volume}
                    shape={<GlowDot payload={evt} />}
                  />
                ))}

                <Brush 
                  dataKey="timestamp"
                  data={unifiedGraphData} 
                  height={30} 
                  stroke="#374151" 
                  fill="#0d131f" 
                  tickFormatter={(ts) => new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} 
                  onChange={(e: { startIndex?: number; endIndex?: number }) => setBrushRange({ startIndex: e.startIndex, endIndex: e.endIndex })}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Evidence Drill-Down Drawer */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-40 w-full max-w-md border-l border-border bg-card shadow-2xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${EVENT_CONFIG[selectedEvent.type].bg} bg-opacity-20`}>
                       {(() => {
                         const Icon = EVENT_CONFIG[selectedEvent.type].icon;
                         return <Icon className={`h-4 w-4 ${EVENT_CONFIG[selectedEvent.type].color}`} />;
                       })()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Evidence View</h3>
                      <p className="text-xs text-zinc-500">{selectedEvent.dateStr}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <h4 className="mb-4 text-lg font-bold text-white">{selectedEvent.title}</h4>
                  <p className="mb-8 text-sm leading-relaxed text-zinc-400">{selectedEvent.summary}</p>

                  <div className="rounded-xl border border-border bg-background overflow-hidden shadow-inner">
                    <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="ml-2 text-[10px] font-mono text-zinc-500">raw_data.log</span>
                    </div>
                    <div className="p-4">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-primary leading-relaxed opacity-80">
                        {selectedEvent.evidenceRaw}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
