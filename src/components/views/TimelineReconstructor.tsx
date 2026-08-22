"use client";

import { useState, useMemo, useRef, useCallback } from "react";
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

// --- Mock Data ---
const graphData = [
  { date: "2023-01", volume: 0, posts: 1 },
  { date: "2023-04", volume: 200, posts: 5 },
  { date: "2023-08", volume: 1500, posts: 12 },
  { date: "2023-11", volume: 4200, posts: 8 },
  { date: "2024-02", volume: 8900, posts: 24 },
  { date: "2024-05", volume: 15000, posts: 45 },
  { date: "2024-08", volume: 22000, posts: 30 },
  { date: "2024-11", volume: 45000, posts: 60 }, // Spike
  { date: "2025-02", volume: 18000, posts: 15 },
  { date: "2025-05", volume: 54000, posts: 75 }, // Peak
  { date: "2025-08", volume: 30000, posts: 10 },
  { date: "2025-11", volume: 0, posts: 0 },
];

type TimelineEventType = "genesis" | "market" | "financial" | "opsec";

interface TimelineEvent {
  id: string;
  dateStr: string; 
  timestamp: number;
  type: TimelineEventType;
  title: string;
  summary: string;
  evidenceRaw: string;
}

const parseDate = (dateStr: string) => new Date(dateStr).getTime();

const rawTimelineEvents: Omit<TimelineEvent, "timestamp">[] = [
  {
    id: "e1",
    dateStr: "2023-01-15",
    type: "genesis",
    title: "PGP Key Generation",
    summary: "A PGP key matching the fingerprint F9B2... was uploaded to a public keyserver.",
    evidenceRaw: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v2.0.22\nmQENBF... (Decrypted: Alias setup)"
  },
  {
    id: "e2",
    dateStr: "2023-04-10",
    type: "market",
    title: "Account Created on Dream Market",
    summary: "First marketplace vendor profile established under the alias 'ShadowPharm'.",
    evidenceRaw: "Archive.is snapshot #89211\nUsername: ShadowPharm\nJoined: 2023-04-10"
  },
  {
    id: "e3",
    dateStr: "2024-05-22",
    type: "market",
    title: "Migration to AlphaBay Reborn",
    summary: "Vendor account created on AlphaBay. Matching PGP Key detected.",
    evidenceRaw: "AlphaBay Vendor DB Dump:\nAlias: BlueSkyDistro\nPGP: F9B2..."
  },
  {
    id: "e4",
    dateStr: "2024-11-14",
    type: "financial",
    title: "Consolidated $45,000 BTC",
    summary: "Massive influx of funds moved into a known Binance off-ramp wallet.",
    evidenceRaw: "TxHash: 0x8a92b...e4f\nAmount: 1.24 BTC\nDestination: Binance Hot Wallet 4"
  },
  {
    id: "e5",
    dateStr: "2025-05-02",
    type: "financial",
    title: "Peak Volume Reached",
    summary: "Sales volume surpassed $54k/month following a competitor's arrest.",
    evidenceRaw: "Scraped feedback counts: 842 positive reviews logged in May 2025 across 3 markets."
  },
  {
    id: "e6",
    dateStr: "2025-08-19",
    type: "opsec",
    title: "Reused Username on Clear-Web",
    summary: "The alias 'BlueSkyDistro' was used to register an account on a car enthusiast forum.",
    evidenceRaw: "Forum DB Leak (CarTalk2025):\nEmail: bluesky_99@proton.me\nIP: 184.22.XX.XX"
  },
  {
    id: "e7",
    dateStr: "2025-10-05",
    type: "opsec",
    title: "Posted Shipping Delay (Weather)",
    summary: "Vendor posted a shipping delay due to local hurricane, narrowing location.",
    evidenceRaw: "Dread Forum Post:\n'Sorry guys, orders delayed 3 days. Hurricane knocked out power in my county.' (Correlates to Florida storm patterns)."
  }
];

// Data Normalization
const unifiedGraphData = graphData.map(d => ({
  ...d,
  timestamp: parseDate(`${d.date}-01`),
}));

const getInterpolatedVolume = (ts: number) => {
  const exact = unifiedGraphData.find(d => d.timestamp === ts);
  if (exact) return exact.volume;
  
  const before = [...unifiedGraphData].reverse().find(d => d.timestamp <= ts);
  const after = unifiedGraphData.find(d => d.timestamp > ts);
  
  if (!before) return after ? after.volume : 0;
  if (!after) return before.volume;
  
  const ratio = (ts - before.timestamp) / (after.timestamp - before.timestamp);
  return before.volume + (after.volume - before.volume) * ratio;
};

const timelineEventsWithCoords = rawTimelineEvents.map((e, index) => {
  const ts = parseDate(e.dateStr);
  return {
    ...e,
    timestamp: ts,
    volume: getInterpolatedVolume(ts),
    index
  };
}).sort((a, b) => a.timestamp - b.timestamp);

const EVENT_CONFIG = {
  genesis: { color: "text-muted-foreground", bg: "bg-slate-400", hex: "#94a3b8", icon: Fingerprint, label: "GENESIS" },
  market: { color: "text-[#a855f7]", bg: "bg-[#a855f7]", hex: "#a855f7", icon: Activity, label: "MARKET" },
  financial: { color: "text-[#10b981]", bg: "bg-[#10b981]", hex: "#10b981", icon: Bitcoin, label: "FINANCIAL" },
  opsec: { color: "text-destructive", bg: "bg-[#ff5572]", hex: "#ff5572", icon: ShieldAlert, label: "OPSEC FAILURE" },
};

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
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dossierData, setDossierData] = useState<{ entityId: string; primaryAlias: string; riskScore: number; status: string; financialProfile: { totalVolumeUSD: number; peakOperationPeriod: string; genesisDate: string; coinJoinRounds: number; }; } | null>(null);

  // Brush state
  const [brushRange, setBrushRange] = useState<{ startIndex?: number, endIndex?: number }>({ startIndex: 0, endIndex: unifiedGraphData.length - 1 });

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
    setSearchError(null);
    setSearchStep(1);

    // Simulate multi-step loading visually
    const t1 = setTimeout(() => setSearchStep(2), 1200); // Scraping Archives
    const t2 = setTimeout(() => setSearchStep(3), 2500); // Running Stylometry
    const t3 = setTimeout(() => setSearchStep(4), 3800); // Reconstructing
    
    let success = false;
    let errorMsg = null;

    try {
      const res = await fetch('/api/reconstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (data && !data.error) {
        setDossierData(data);
        success = true;
      } else {
        errorMsg = data.error || "No data found for this entity.";
      }
    } catch (err) {
      console.error(err);
      errorMsg = "Failed to reconstruct timeline.";
    } finally {
      // Ensure minimum UI loading time for visual effect
      setTimeout(() => {
        setIsSearching(false);
        if (success) {
          setHasResults(true);
          setBrushRange({ startIndex: 0, endIndex: unifiedGraphData.length - 1 });
        } else {
          setSearchError(errorMsg);
        }
      }, Math.max(0, 4500));
    }
  };

  const activeGraphData = useMemo(() => {
    if (!hasResults || brushRange.startIndex === undefined || brushRange.endIndex === undefined) return unifiedGraphData;
    return unifiedGraphData.slice(brushRange.startIndex, brushRange.endIndex + 1);
  }, [hasResults, brushRange]);

  const activeTimelineEvents = useMemo(() => {
    if (!hasResults || activeGraphData.length === 0) return [];
    const minTs = activeGraphData[0].timestamp;
    const maxTs = activeGraphData[activeGraphData.length - 1].timestamp;
    return timelineEventsWithCoords.filter(e => e.timestamp >= minTs && e.timestamp <= maxTs);
  }, [hasResults, activeGraphData]);

  return (
    <div className="flex h-full flex-col bg-background">
      
      {/* Search Header */}
      <div className="z-header border-b border-border bg-background/95 px-8 py-6 backdrop-blur-md sticky top-0 shrink-0">
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
          <AnimatePresence>
            {searchError && !isSearching && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-center gap-2 text-sm text-red-400 justify-center"
              >
                <ShieldAlert className="h-4 w-4" />
                {searchError}
              </motion.div>
            )}
          </AnimatePresence>
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
            <div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-drawer w-full max-w-md border-l border-border bg-card shadow-2xl"
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
