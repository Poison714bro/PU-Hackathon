"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { 
  Search, 
  Activity, 
  ShieldAlert, 
  Bitcoin, 
  Fingerprint, 
  ExternalLink,
  X,
  Terminal,
  Zap,
  Sparkles,
  CheckCircle2,
  Layers
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

// Mock Data
const graphData = [
  { date: "2023-01", volume: 0, posts: 1 },
  { date: "2023-04", volume: 200, posts: 5 },
  { date: "2023-08", volume: 1500, posts: 12 },
  { date: "2023-11", volume: 4200, posts: 8 },
  { date: "2024-02", volume: 8900, posts: 24 },
  { date: "2024-05", volume: 15000, posts: 45 },
  { date: "2024-08", volume: 22000, posts: 30 },
  { date: "2024-11", volume: 45000, posts: 60 },
  { date: "2025-02", volume: 18000, posts: 15 },
  { date: "2025-05", volume: 54000, posts: 75 },
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

  const [brushRange, setBrushRange] = useState<{ startIndex?: number, endIndex?: number }>({ startIndex: 0, endIndex: unifiedGraphData.length - 1 });
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const chartRef = useRef<any>(null);

  // Semantica Triplet & IOC Studio State
  const [timelineTab, setTimelineTab] = useState<"engine" | "studio">("engine");
  const [rawTextInput, setRawTextInput] = useState(
    "Vendor DarkPhoenix_77 active on Dread. Bulk fentanyl HCL pressed pills dispatching today. Send 0.5 BTC to bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2. Verify via PGP 1109E77A8C3D5F6B7E2A9D014C8F3B62F9B24A32. Telegram contact @DarkPhoenix_Direct. Mirror link http://exampldarknetv3abc56def78ghij90klmn12opqrst34uvwx56yz78.onion"
  );
  const [extractedIocs, setExtractedIocs] = useState<any>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);

  const handleRunExtraction = async () => {
    try {
      const res = await api.intelligence.extractTriplets(rawTextInput);
      if (res.ok && res.data) {
        setExtractedIocs({
          wallets: res.data.iocs?.wallets || [],
          pgpKeys: res.data.iocs?.pgpKeys || [],
          telegrams: res.data.iocs?.telegramHandles || [],
          onions: res.data.iocs?.onionLinks || [],
          contraband: res.data.iocs?.contraband || [],
          triplets: res.data.triplets || []
        });
        return;
      }
    } catch {
      // Fallback
    }

    const btcMatches = rawTextInput.match(/\b(bc1[a-zA-HJ-NP-Z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/gi) || [];
    const pgpMatches = rawTextInput.match(/\b[0-9A-Fa-f]{40}\b/gi) || [];
    const telegramMatches = rawTextInput.match(/@([a-zA-Z0-9_]{5,32})\b/gi) || [];
    const onionMatches = rawTextInput.match(/\b[a-z2-7]{56}\.onion\b/gi) || [];

    const drugsFound: string[] = [];
    ["fentanyl", "oxycodone", "mdma", "methamphetamine", "cocaine"].forEach((d) => {
      if (rawTextInput.toLowerCase().includes(d)) drugsFound.push(d.toUpperCase());
    });

    setExtractedIocs({
      wallets: Array.from(new Set(btcMatches)),
      pgpKeys: Array.from(new Set(pgpMatches)),
      telegrams: Array.from(new Set(telegramMatches)),
      onions: Array.from(new Set(onionMatches)),
      contraband: drugsFound,
      triplets: [
        { subject: "DarkPhoenix_77", predicate: "SUPPLIES", object: "Fentanyl & Oxycodone" },
        { subject: "DarkPhoenix_77", predicate: "ACCEPTS_PAYMENT", object: btcMatches[0] || "bc1q9h...x4k2" },
        { subject: "DarkPhoenix_77", predicate: "SIGNS_WITH_PGP", object: pgpMatches[0] || "1109E77A...3B62" },
        { subject: "DarkPhoenix_77", predicate: "OPERATES_ON_CHANNEL", object: telegramMatches[0] || "@DarkPhoenix_Direct" },
      ],
    });
  };

  const handleIngestToGraph = async () => {
    setIsIngesting(true);
    try {
      const res = await api.ingest.pipeline(rawTextInput, "Darknet Studio Ingestion");
      if (res.ok) {
        setIngestSuccess(true);
        setTimeout(() => setIngestSuccess(false), 3000);
      }
    } catch {
      // Fallback
    } finally {
      setIsIngesting(false);
    }
  };

  useEffect(() => {
    handleRunExtraction();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasResults(false);
    setSearchError(null);
    setSearchStep(1);

    const t1 = setTimeout(() => setSearchStep(2), 1200);
    const t2 = setTimeout(() => setSearchStep(3), 2500);
    const t3 = setTimeout(() => setSearchStep(4), 3800);
    
    let success = false;
    let errorMsg: string | null = null;

    try {
      const res = await fetch('/api/v1/reconstruct', {
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
    <div className="flex h-full flex-col bg-background overflow-hidden">
      {/* Sub-Navigation Modes for Timeline Engine */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800 bg-[#0d131f]/95 px-6 py-2.5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          {[
            { id: "engine", label: "Temporal Timeline Engine", icon: Activity },
            { id: "studio", label: "Darknet Triplet & IOC Studio", icon: Terminal, badge: "NLP / Regex" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = timelineTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimelineTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-[#00d4ff]/10 border border-[#00d4ff]/40 text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#00d4ff]" : "text-slate-500"}`} />
                {tab.label}
                {tab.badge && (
                  <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[9px] font-mono text-slate-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">ENGINE:</span>
          <span className="text-[10px] font-mono font-bold text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/30 px-2 py-0.5 rounded">
            SEMANTICA TEMPORAL v2.4
          </span>
        </div>
      </div>

      {/* VIEW 2: DARKNET TRIPLET STUDIO */}
      {timelineTab === "studio" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
          <div>
            <h2 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#00d4ff]" />
              Darknet Text & Semantic Triplet Mining Studio
            </h2>
            <p className="text-xs text-slate-400">
              Paste raw darknet forum dumps, Telegram transcripts, or seizure logs to extract IOCs and RDF Triplet Graphs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="rounded-xl border border-slate-800 bg-[#0d131f]/90 p-5 backdrop-blur-md space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                RAW DARKNET INTELLIGENCE INPUT
              </label>
              <textarea
                rows={8}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-black/60 p-4 text-xs text-white focus:border-[#00d4ff] focus:outline-none font-mono leading-relaxed"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRunExtraction}
                  className="flex-1 rounded-lg bg-[#00d4ff] hover:bg-cyan-400 text-black py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                >
                  <Zap className="h-4 w-4 fill-black" />
                  Extract Indicators & Triplets
                </button>
                <button
                  onClick={handleIngestToGraph}
                  disabled={isIngesting}
                  className={`px-4 rounded-lg border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    ingestSuccess
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                  }`}
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
                  {ingestSuccess ? "Ingested!" : isIngesting ? "Ingesting..." : "Ingest to Graph"}
                </button>
              </div>
            </div>

            {/* Output Panel */}
            <div className="rounded-xl border border-slate-800 bg-[#0d131f]/90 p-5 backdrop-blur-md space-y-4">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                EXTRACTED INDICATORS OF COMPROMISE (IOCS)
              </span>

              {extractedIocs && (
                <div className="space-y-3 font-mono text-xs">
                  {/* Wallets */}
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">CRYPTO WALLETS ({extractedIocs.wallets.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedIocs.wallets.map((w: string) => (
                        <span key={w} className="rounded bg-slate-800 border border-amber-500/30 px-2 py-1 text-amber-300 text-[11px] truncate max-w-full">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* PGP */}
                  <div>
                    <span className="text-[10px] text-[#00d4ff] font-bold uppercase">PGP FINGERPRINTS ({extractedIocs.pgpKeys.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedIocs.pgpKeys.map((k: string) => (
                        <span key={k} className="rounded bg-slate-800 border border-cyan-500/30 px-2 py-1 text-cyan-300 text-[11px]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Triplets */}
                  <div>
                    <span className="text-[10px] text-purple-400 font-bold uppercase">MINED RDF TRIPLETS ({extractedIocs.triplets.length})</span>
                    <div className="space-y-1.5 mt-1">
                      {extractedIocs.triplets.map((t: any, i: number) => (
                        <div key={i} className="rounded bg-black/40 border border-slate-800 p-2 text-[11px] flex items-center justify-between">
                          <span className="text-white font-bold">{t.subject}</span>
                          <span className="text-purple-400 font-bold">-[{t.predicate}]-&gt;</span>
                          <span className="text-amber-300 truncate max-w-[160px]">{t.object}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: TIMELINE EVENT ENGINE */}
      {timelineTab === "engine" && (
        <div className="flex-1 flex flex-col overflow-hidden">
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
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="mx-auto mt-6 max-w-xl rounded-xl border border-border bg-card/80 p-5 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex flex-col gap-3">
                    {[
                      { step: 1, text: "Querying Blockchain Graph & Clustering Wallets..." },
                      { step: 2, text: "Scraping Darknet Archives & PGP Keyservers..." },
                      { step: 3, text: "Running Cross-Market Stylometry Analysis..." },
                      { step: 4, text: "Reconstructing Temporal Activity Vectors..." },
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 items-center justify-center">
                          {searchStep > item.step ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</motion.div>
                          ) : searchStep === item.step ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-zinc-700" />
                          )}
                        </div>
                        <span className={`text-xs font-medium ${searchStep >= item.step ? "text-zinc-200" : "text-zinc-600"}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Body Content */}
          {!hasResults && !isSearching && (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card/50 shadow-inner">
                <Activity className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-300">No Target Timeline Loaded</h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500">
                Search for a known entity alias, cryptocurrency address, or PGP fingerprint to generate a chronological profile.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["DarkPhoenix_77", "Ph03nix_Rx", "bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => { setQuery(preset); }}
                    className="rounded-lg border border-border bg-card px-3 py-1 text-[11px] font-mono text-zinc-400 transition-colors hover:border-primary/50 hover:text-zinc-200"
                  >
                    {preset.length > 20 ? `${preset.slice(0, 8)}...${preset.slice(-6)}` : preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasResults && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Upper Section: Split Volume & Market Frequency Chart */}
              <div className="relative flex flex-col border-b border-border bg-card/30 p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Temporal Activity Vector & Financial Volume</h3>
                    <p className="text-xs text-zinc-500">Multi-axis alignment of monthly transaction volume ($) and darknet post frequency</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-zinc-400">Volume (USD)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" />
                      <span className="text-zinc-400">Post Frequency</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full" ref={chartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={unifiedGraphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val / 1000}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#a855f7" tick={{ fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#0d131f", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }} />
                      
                      <Area yAxisId="left" type="monotone" dataKey="volume" stroke="#10b981" fillOpacity={1} fill="url(#volGrad)" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="posts" stroke="#a855f7" strokeWidth={2} dot={{ r: 3, fill: "#a855f7" }} />
                      
                      {timelineEventsWithCoords.map((evt) => (
                        <ReferenceDot
                          key={evt.id}
                          yAxisId="left"
                          x={evt.dateStr.slice(0, 7)}
                          y={evt.volume}
                          shape={<GlowDot payload={{ type: evt.type }} />}
                          onClick={() => setSelectedEvent(evt)}
                        />
                      ))}

                      <Brush
                        dataKey="date"
                        height={25}
                        stroke="#00d4ff"
                        fill="#070a10"
                        onChange={(range) => setBrushRange(range)}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lower Section: Horizontal Flow Stream */}
              <div className="flex flex-1 overflow-x-auto p-6 custom-scrollbar items-start gap-4">
                {activeTimelineEvents.map((evt) => {
                  const config = EVENT_CONFIG[evt.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      onMouseEnter={() => setHoveredCardId(evt.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      className={`w-72 shrink-0 rounded-xl border p-4 backdrop-blur-md cursor-pointer transition-all ${
                        hoveredCardId === evt.id ? "border-primary shadow-[0_0_20px_rgba(0,212,255,0.2)] bg-[#0f111a]" : "border-slate-800 bg-[#0d131f]/80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono ${config.bg} bg-opacity-20 ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{evt.dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <h4 className="text-xs font-bold text-white truncate">{evt.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                        {evt.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-out Evidence View Drawer */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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

                  <div className="rounded-xl border border-border bg-background/50 overflow-hidden">
                    <div className="flex items-center border-b border-border bg-zinc-900/50 px-4 py-2">
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
