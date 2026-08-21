import { Fingerprint, Activity, Bitcoin, ShieldAlert } from "lucide-react";

// --- Types ---
export type TimelineEventType = "genesis" | "market" | "financial" | "opsec";

export interface TimelineEvent {
  id: string;
  dateStr: string; 
  timestamp: number;
  type: TimelineEventType;
  title: string;
  summary: string;
  evidenceRaw: string;
  volume: number;
  index: number;
}

export interface GraphDataPoint {
  date: string;
  volume: number;
  posts: number;
  timestamp: number;
}

const parseDate = (dateStr: string) => new Date(dateStr).getTime();

// --- Mock Graph Data ---
export const timelineGraphData: Omit<GraphDataPoint, "timestamp">[] = [
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

// --- Raw Timeline Events ---
export const rawTimelineEvents: Array<Omit<TimelineEvent, "timestamp" | "volume" | "index">> = [
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

// --- Event Configuration ---
export const EVENT_CONFIG = {
  genesis: { color: "text-muted-foreground", bg: "bg-slate-400", hex: "#94a3b8", icon: Fingerprint, label: "GENESIS" },
  market: { color: "text-[#a855f7]", bg: "bg-[#a855f7]", hex: "#a855f7", icon: Activity, label: "MARKET" },
  financial: { color: "text-[#10b981]", bg: "bg-[#10b981]", hex: "#10b981", icon: Bitcoin, label: "FINANCIAL" },
  opsec: { color: "text-destructive", bg: "bg-[#ff5572]", hex: "#ff5572", icon: ShieldAlert, label: "OPSEC FAILURE" },
} as const;

// --- Data Processing Utilities ---
export function getUnifiedGraphData(): GraphDataPoint[] {
  return timelineGraphData.map(d => ({
    ...d,
    timestamp: parseDate(`${d.date}-01`),
  }));
}

export function getInterpolatedVolume(unifiedGraphData: GraphDataPoint[], ts: number): number {
  const exact = unifiedGraphData.find(d => d.timestamp === ts);
  if (exact) return exact.volume;
  
  const before = [...unifiedGraphData].reverse().find(d => d.timestamp <= ts);
  const after = unifiedGraphData.find(d => d.timestamp > ts);
  
  if (!before) return after ? after.volume : 0;
  if (!after) return before.volume;
  
  const ratio = (ts - before.timestamp) / (after.timestamp - before.timestamp);
  return before.volume + (after.volume - before.volume) * ratio;
}

export function getTimelineEventsWithCoords(unifiedGraphData: GraphDataPoint[]): TimelineEvent[] {
  return rawTimelineEvents.map((e, index) => {
    const ts = parseDate(e.dateStr);
    return {
      ...e,
      timestamp: ts,
      volume: getInterpolatedVolume(unifiedGraphData, ts),
      index
    };
  }).sort((a, b) => a.timestamp - b.timestamp);
}

export function getActiveTimelineEvents(
  events: TimelineEvent[], 
  graphData: GraphDataPoint[], 
  brushRange: { startIndex?: number; endIndex?: number }
): TimelineEvent[] {
  if (brushRange.startIndex === undefined || brushRange.endIndex === undefined) return events;
  if (graphData.length === 0) return [];
  
  const minTs = graphData[brushRange.startIndex]?.timestamp ?? 0;
  const maxTs = graphData[brushRange.endIndex]?.timestamp ?? Infinity;
  
  return events.filter(e => e.timestamp >= minTs && e.timestamp <= maxTs);
}

export function getActiveGraphData(
  graphData: GraphDataPoint[], 
  brushRange: { startIndex?: number; endIndex?: number }
): GraphDataPoint[] {
  if (!brushRange.startIndex || !brushRange.endIndex) return graphData;
  return graphData.slice(brushRange.startIndex, brushRange.endIndex + 1);
}