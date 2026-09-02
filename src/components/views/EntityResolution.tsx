"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  CheckCircle2, 
  Key, 
  MessageSquare, 
  Activity, 
  Image as ImageIcon,
  Bitcoin,
  Merge,
  XOctagon,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  SearchX,
  Copy,
  Loader2,
  X,
  Wifi,
  WifiOff,
  Search,
  ExternalLink,
  Crown,
  Layers,
  Sparkles,
  Users,
  ShieldAlert
} from "lucide-react";
import ReactFlow, { Background, MarkerType, useNodesState, useEdgesState, BaseEdge, EdgeProps, getSmoothStepPath, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceArea, XAxis, Tooltip as RechartsTooltip } from "recharts";

import { api } from "@/lib/apiClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { calculateCentralityScores, detectGraphCommunities, GraphNode, GraphEdge } from "@/lib/graphAnalytics";

// Graph Data for Community & Kingpin Analytics
const MOCK_GRAPH_NODES: GraphNode[] = [
  { id: "ent-001", label: "DarkPhoenix_77", type: "suspect", riskScore: 94, category: "Opioids / Bulk Supplier", status: "Active Target", aliases: ["DP_Supply", "Ph03nix_Rx"], wallets: ["bc1q9hk7...x4k2"] },
  { id: "ent-002", label: "Ph03nix_Rx", type: "suspect", riskScore: 87, category: "Opioids / Vendor", status: "Under Investigation", aliases: ["DarkPhoenix_77"], wallets: ["bc1q9hk7...x4k2"] },
  { id: "ent-003", label: "@Ghost_Supply", type: "suspect", riskScore: 78, category: "Stimulants / MDMA", status: "Active Target", aliases: ["GhostBulk", "SpeedGhost"], wallets: ["bc1qxy2k...0wlh"] },
  { id: "ent-004", label: "S11kR0ad_Vendor", type: "suspect", riskScore: 91, category: "Prescription / Vendor", status: "Under Investigation", aliases: ["SilkRoad_Legacy"], wallets: ["bc1q5v8n...r1e"] },
  { id: "ent-005", label: "ChemKing2026", type: "suspect", riskScore: 82, category: "Precursor Chemicals", status: "Active Target", aliases: ["CK_2026", "CK_NL"], wallets: ["bc1qar0s...5mdq"] },
  { id: "ent-006", label: "NightOwl_Pharm", type: "suspect", riskScore: 65, category: "Prescription", status: "Active Target", aliases: ["OwlPharm"], wallets: ["bc1q7kw2...gy3yr2"] },
  { id: "wallet-btc-1", label: "bc1q9hk7...x4k2", type: "wallet", riskScore: 95, volumeUSD: "$2,450,000", currency: "BTC" },
  { id: "wallet-xmr-1", label: "42xM7q9L...P2xL", type: "wallet", riskScore: 90, volumeUSD: "$890,000", currency: "XMR" },
  { id: "mixer-relay-1", label: "ChipMixer_Relay_04", type: "mixer", riskScore: 99, volumeUSD: "$5,100,000" },
  { id: "pgp-key-1", label: "PGP: F9B24A32", type: "pgp", riskScore: 80, keyId: "F9B24A32" },
];

const MOCK_GRAPH_EDGES: GraphEdge[] = [
  { source: "ent-001", target: "wallet-btc-1", relation: "OWNS_WALLET", label: "Owns Primary Wallet" },
  { source: "ent-002", target: "wallet-btc-1", relation: "CO_OWNS", label: "Co-Controls Wallet" },
  { source: "ent-001", target: "pgp-key-1", relation: "SIGNS_WITH", label: "Signs Messages" },
  { source: "ent-002", target: "pgp-key-1", relation: "USES_PGP", label: "Uses Key" },
  { source: "ent-001", target: "mixer-relay-1", relation: "LAUNDERS_VIA", label: "Laundering Deposit" },
  { source: "ent-004", target: "mixer-relay-1", relation: "LAUNDERS_VIA", label: "Laundering Deposit" },
  { source: "mixer-relay-1", target: "wallet-xmr-1", relation: "CASHOUT", label: "Anonymous Cash-Out" },
  { source: "ent-003", target: "ent-005", relation: "SUPPLIES_BULK", label: "Bulk Precursor Supply" },
  { source: "ent-005", target: "wallet-xmr-1", relation: "PAYMENT", label: "Chemical Settlement" },
  { source: "ent-006", target: "ent-003", relation: "REFERRAL", label: "Customer Referral" },
];

// --- CUSTOM EDGE (Particle Flow) ---
function AnimatedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: data?.weight || 2, strokeOpacity: 0.3 }} />
      <circle r="4" fill="#10b981">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}

const edgeTypes = { animatedEdge: AnimatedEdge };

const getMiniGraphNodes = (aliasA: string, aliasB: string, wallet: string, total: string) => [
  { id: "A", position: { x: 30, y: 30 }, data: { label: aliasA }, style: { background: "#070a10", color: "#fff", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "9px", width: 100 } },
  { id: "B", position: { x: 30, y: 130 }, data: { label: aliasB }, style: { background: "#070a10", color: "#fff", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "9px", width: 100 } },
  { id: "C", position: { x: 180, y: 80 }, data: { label: `${wallet}\n${total}` }, style: { background: "#10b981", color: "#070a10", border: "none", borderRadius: "8px", fontSize: "9px", fontWeight: "bold", width: 100 } },
];

const getMiniGraphEdges = () => [
  { id: "e1", source: "A", target: "C", type: "animatedEdge", data: { weight: 3 }, style: { stroke: "#10b981" } },
  { id: "e2", source: "B", target: "C", type: "animatedEdge", data: { weight: 5 }, style: { stroke: "#10b981" } },
];

const sparklineData = [
  { time: "0h", a: 80, b: 0 },
  { time: "12h", a: 75, b: 0 },
  { time: "24h", a: 90, b: 0 },
  { time: "36h", a: 0, b: 0 },
  { time: "48h", a: 0, b: 0 },
  { time: "60h", a: 0, b: 0 },
  { time: "72h", a: 0, b: 85 },
  { time: "84h", a: 0, b: 92 },
  { time: "96h", a: 0, b: 88 },
];

const radarData = [
  { subject: 'Vocabulary', A: 120, B: 110, fullMark: 150 },
  { subject: 'Grammar', A: 98, B: 95, fullMark: 150 },
  { subject: 'Structure', A: 86, B: 88, fullMark: 150 },
  { subject: 'Slang/Jargon', A: 99, B: 105, fullMark: 150 },
];

const txData = [
  { hash: "0x3f...9a12", time: "2026-08-20 14:32", amount: "$12,400" },
  { hash: "0x8a...2b44", time: "2026-08-21 09:15", amount: "$8,500" },
  { hash: "0xc1...5f09", time: "2026-08-22 18:44", amount: "$27,300" }
];

export default function EntityResolution() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolutionTab, setResolutionTab] = useState<"candidates" | "syndicates" | "kingpins">("candidates");

  const [isMerging, setIsMerging] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "warning" }[]>([]);
  const [toastId, setToastId] = useState(0);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);
  
  const [pingStatus, setPingStatus] = useState<"idle" | "pinging" | "online">("idle");
  const [showRadar, setShowRadar] = useState(false);

  // Semantica Graph Intelligence Computations
  const centralityScores = useMemo(() => {
    return calculateCentralityScores(MOCK_GRAPH_NODES, MOCK_GRAPH_EDGES);
  }, []);

  const communities = useMemo(() => {
    return detectGraphCommunities(MOCK_GRAPH_NODES, MOCK_GRAPH_EDGES);
  }, []);

  const topKingpins = useMemo(() => {
    return Object.entries(centralityScores)
      .map(([id, metrics]) => {
        const node = MOCK_GRAPH_NODES.find((n) => n.id === id);
        return {
          id,
          label: node?.label || id,
          type: node?.type || "unknown",
          riskScore: node?.riskScore || 50,
          category: node?.category || "Unknown",
          ...metrics,
        };
      })
      .sort((a, b) => b.kingpinIndex - a.kingpinIndex);
  }, [centralityScores]);

  useEffect(() => {
    let cancelled = false;
    api.intelligence.aliasMatches().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        setCandidates(res.data);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const addToast = useCallback((message: string, type: "success" | "warning") => {
    const id = toastId + 1;
    setToastId(id);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, [toastId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const removeCurrentAndAdvance = useCallback(() => {
    setCandidates((prev) => prev.filter((_, i) => i !== currentIndex));
    if (currentIndex >= candidates.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  }, [currentIndex, candidates.length]);

  const handleFlagFalsePositive = useCallback(() => {
    if (isMerging || candidates.length === 0) return;
    addToast("Candidate flagged as false positive", "warning");
    removeCurrentAndAdvance();
  }, [isMerging, candidates.length, addToast, removeCurrentAndAdvance]);

  const handleMergePersonas = useCallback(async () => {
    if (isMerging || candidates.length === 0) return;
    const target = candidates[currentIndex];
    setIsMerging(true);

    try {
      const res = await api.intelligence.mergeAliases(
        target.aliasA.name,
        target.aliasB.name,
        "Analyst verified match in Entity Resolution queue"
      );

      if (res.ok) {
        addToast(`Unified Master Profile created: ${target.aliasA.name}`, "success");
        removeCurrentAndAdvance();
      } else {
        addToast("Failed to merge entities on backend", "warning");
      }
    } catch {
      addToast("Network Error: Merge aborted", "warning");
    } finally {
      setIsMerging(false);
    }
  }, [isMerging, candidates, currentIndex, addToast, removeCurrentAndAdvance]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < candidates.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, candidates.length]);

  const simulatePing = () => {
    setPingStatus("pinging");
    setTimeout(() => setPingStatus("online"), 1200);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[var(--background)]">
        <div className="h-64 w-full max-w-4xl animate-pulse rounded-xl bg-slate-900/50" />
      </div>
    );
  }

  const currentCandidate = candidates[currentIndex];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#030711] text-foreground custom-scrollbar relative">
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md pointer-events-auto ${toast.type === 'success' ? 'border-[#10b981]/50 bg-[#0f111a]/80' : 'border-[#ff5572]/50 bg-[#0f111a]/80'}`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-[#10b981]" /> : <XOctagon className="h-4 w-4 text-[#ff5572]" />}
              <span className="text-xs font-bold uppercase tracking-wider text-white">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={() => setLightboxImage(null)}
          >
            <button className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X className="h-8 w-8" />
            </button>
            <div className="flex flex-col items-center">
              <img src={lightboxImage.src} alt="Lightbox" className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-[0_0_40px_rgba(0,255,255,0.1)] border border-slate-700" />
              <div className="mt-4 text-white font-bold tracking-widest uppercase">{lightboxImage.title}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Navigation Modes for Entity Resolution */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800 bg-[#0d131f]/95 px-6 py-2.5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          {[
            { id: "candidates", label: "Persona Merge Queue", icon: Merge, count: candidates.length },
            { id: "syndicates", label: "Cartels & Syndicates", icon: Layers, count: communities.length },
            { id: "kingpins", label: "Kingpin & Broker Matrix", icon: Crown, count: topKingpins.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = resolutionTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setResolutionTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-[#00d4ff]/10 border border-[#00d4ff]/40 text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#00d4ff]" : "text-slate-500"}`} />
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${isActive ? "bg-[#00d4ff] text-black font-black" : "bg-slate-800 text-slate-400"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">ENGINE:</span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
            SEMANTICA RESOLUTION v2.4
          </span>
        </div>
      </div>

      {/* VIEW 2: CARTELS & SYNDICATES */}
      {resolutionTab === "syndicates" && (
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#00d4ff]" />
                Detected Criminal Communities & Cartel Clusters
              </h2>
              <p className="text-xs text-slate-400">
                Louvain modularity optimization & Label Propagation discovering tight criminal rings and isolated illicit networks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
                Modularity Q: <strong className="text-emerald-400">0.742</strong>
              </span>
              <span className="rounded bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
                Coverage: <strong className="text-[#00d4ff]">100%</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {communities.map((comm, idx) => {
              const memberNodes = comm.members.map((m) => MOCK_GRAPH_NODES.find((n) => n.id === m)).filter(Boolean);
              const suspectCount = memberNodes.filter((m) => m?.type === "suspect").length;
              const walletCount = memberNodes.filter((m) => m?.type === "wallet").length;
              const isHighRisk = suspectCount >= 2;

              return (
                <div
                  key={comm.id}
                  className="group rounded-xl border border-slate-800 bg-[#0d131f]/80 p-5 backdrop-blur-md transition-all hover:border-[#00d4ff]/50 hover:shadow-[0_0_30px_rgba(0,212,255,0.15)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider font-mono border ${
                        isHighRisk
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30"
                      }`}>
                        {isHighRisk ? "CRITICAL SYNDICATE" : "OPERATIONAL CELL"}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Density: <strong className="text-white">{Math.round(comm.density * 100)}%</strong>
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-white group-hover:text-[#00d4ff] transition-colors mb-1">
                      {comm.label}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {suspectCount} Suspect Targets • {walletCount} Crypto Wallets • {comm.members.length} Total Nodes
                    </p>

                    <div className="space-y-2 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        CLUSTER PARTICIPANTS
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {memberNodes.map((m) => (
                          <span
                            key={m?.id}
                            className={`rounded px-2 py-1 text-[11px] font-mono border ${
                              m?.type === "suspect"
                                ? "bg-slate-800 text-amber-300 border-amber-500/30"
                                : m?.type === "wallet"
                                ? "bg-slate-800 text-cyan-300 border-cyan-500/30"
                                : "bg-slate-900 text-slate-400 border-slate-700"
                            }`}
                          >
                            {m?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Inferred Activity:</span>
                    <span className="font-bold text-white">{idx === 0 ? "Fentanyl Bulk Pipeline" : idx === 1 ? "Synthetic Precursors" : "Prescription Diversion"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: KINGPIN & BROKER MATRIX */}
      {resolutionTab === "kingpins" && (
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                Network Kingpin & Broker Centrality Matrix
              </h2>
              <p className="text-xs text-slate-400">
                PageRank authority algorithms combined with Betweenness Centrality (critical bridges) to uncover top leadership.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d131f]/90 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-black/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Rank & Target</th>
                    <th className="px-5 py-3.5">Category / Classification</th>
                    <th className="px-5 py-3.5 text-center">Kingpin Index (0-100)</th>
                    <th className="px-5 py-3.5 text-center">PageRank Authority</th>
                    <th className="px-5 py-3.5 text-center">Betweenness (Broker)</th>
                    <th className="px-5 py-3.5">Inferred Organizational Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {topKingpins.map((kp, idx) => (
                    <tr key={kp.id} className="hover:bg-[#00d4ff]/5 transition-colors">
                      <td className="px-5 py-4 font-sans">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-6 w-6 items-center justify-center rounded font-mono text-xs font-black ${
                            idx === 0 ? "bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]" : idx === 1 ? "bg-slate-300 text-black" : idx === 2 ? "bg-amber-700 text-white" : "bg-slate-800 text-slate-400"
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {kp.label}
                              {idx === 0 && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {kp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-sans text-slate-300">
                        {kp.category}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                              style={{ width: `${kp.kingpinIndex}%` }}
                            />
                          </div>
                          <span className="font-black text-amber-400 text-sm">{kp.kingpinIndex}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center text-[#00d4ff] font-bold">
                        {kp.pagerank}
                      </td>
                      <td className="px-5 py-4 text-center text-purple-400 font-bold">
                        {kp.betweenness}
                      </td>
                      <td className="px-5 py-4 font-sans">
                        <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                          {kp.inferredRole}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: PERSONA MERGE QUEUE */}
      {resolutionTab === "candidates" && (
        !currentCandidate ? (
          <div className="flex h-96 items-center justify-center p-8 text-muted-foreground relative">
            <EmptyState icon={SearchX} title="No Candidates Found" description="The AI Entity Resolution engine has not identified any aliases that exceed the match confidence threshold." />
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            {/* Candidate Triage Bar */}
            <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-[#0a0f18]/90 px-6 py-3 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border border-slate-700/50 rounded-md bg-[#0f111a]/50 px-2 py-1 backdrop-blur-sm">
                  <button 
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-[#0a0f18] disabled:opacity-30 hover:text-white group relative"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Reviewing Candidate {currentIndex + 1} of {candidates.length}
                  </span>
                  <button 
                    onClick={handleNext}
                    disabled={currentIndex === candidates.length - 1}
                    className="p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-[#0a0f18] disabled:opacity-30 hover:text-white group relative"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 border border-slate-700/50 rounded-md bg-[#0f111a]/50 px-3 py-1.5 backdrop-blur-sm">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Confidence: &gt;90%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleFlagFalsePositive}
                  disabled={isMerging}
                  className="group relative flex items-center gap-2 rounded-md border border-[#ff5572]/50 bg-[#ff5572]/5 px-4 py-1.5 text-xs font-bold text-[#ff5572] uppercase tracking-wider transition-all hover:bg-[#ff5572]/15 focus:outline-none focus:ring-2 focus:ring-[#ff5572] disabled:opacity-50"
                >
                  <XOctagon className="h-4 w-4" />
                  Flag False Positive
                </button>
                
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-lg bg-[#10b981] opacity-20 blur-sm group-hover:animate-pulse transition-all"></div>
                  <button 
                    onClick={handleMergePersonas}
                    disabled={isMerging}
                    className="relative flex items-center gap-2 rounded-md bg-[#10b981] px-5 py-1.5 text-xs font-black text-[#030711] uppercase tracking-widest transition-all hover:bg-[#059669] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] focus:outline-none focus:ring-2 focus:ring-[#10b981] disabled:opacity-50 overflow-hidden"
                  >
                    {isMerging ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Unifying Personas...
                      </>
                    ) : (
                      <>
                        <Merge className="h-4 w-4 stroke-[3]" />
                        Confirm Merge
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Split Comparison Cards */}
            <div className="border-b border-border bg-[#0a0f18]/60 p-6 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-7xl mx-auto">
                <div className="flex-1 rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-xl hover:border-slate-500/50 transition-all w-full">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded bg-[#a855f7]/20 border border-[#a855f7]/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d8b4fe] shadow-[0_0_10px_rgba(168,85,247,0.2)]">Alias A</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/20 px-2 py-1 rounded">Active: {currentCandidate.aliasA?.joinDate}</span>
                  </div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate tracking-tight">{currentCandidate.aliasA?.name}</h2>
                  <p className="text-sm font-bold text-cyan-400 mt-2">{currentCandidate.aliasA?.market}</p>
                </div>

                {/* Score Gauge */}
                <div className="w-[320px] shrink-0 flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="relative z-10 flex items-center gap-6 w-full">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-black/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-slate-800">
                      <span className="text-2xl font-black text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{currentCandidate.confidence}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match Metric</span>
                      <div className="text-sm font-black text-white mt-0.5 uppercase tracking-wide">High Confidence Match</div>
                      <p className="text-[10px] text-slate-400 mt-1">Multi-factor cryptographic & alias parity verified.</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-xl hover:border-slate-500/50 transition-all w-full">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.2)]">Alias B</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/20 px-2 py-1 rounded">Active: {currentCandidate.aliasB?.joinDate}</span>
                  </div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate tracking-tight">{currentCandidate.aliasB?.name}</h2>
                  <p className="text-sm font-bold text-cyan-400 mt-2">{currentCandidate.aliasB?.market}</p>
                </div>
              </div>
            </div>

            {/* Evidence Cards */}
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-2 grid-rows-2 gap-6 max-w-7xl mx-auto h-full">
                  {/* Card 1: PGP Verification */}
                  <div className="col-span-1 flex flex-col rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-slate-500/50">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">PGP Key Parity</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full border border-[#10b981]/30">
                        <CheckCircle2 className="h-3 w-3" /> 100% BIT-FOR-BIT MATCH
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fingerprint (Alias A)</span>
                        <p className="font-mono text-[10px] text-[#10b981] bg-[#10b981]/10 p-2.5 rounded-lg border border-[#10b981]/30 truncate">
                          {currentCandidate.aliasA?.pgp}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fingerprint (Alias B)</span>
                        <p className="font-mono text-[10px] text-[#10b981] bg-[#10b981]/10 p-2.5 rounded-lg border border-[#10b981]/30 truncate">
                          {currentCandidate.aliasB?.pgp}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Comms Identifiers */}
                  <div className="col-span-1 flex flex-col rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-slate-500/50">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">Comms Identifiers</span>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                    </div>
                    <div className="flex-1 flex flex-col gap-3 justify-center">
                      <div className="flex items-center justify-between bg-gradient-to-r from-[#10b981]/10 to-transparent border border-[#10b981]/30 rounded-lg p-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tox ID (Match)</span>
                          <span className="font-mono text-sm font-bold text-[#10b981]">593A1B2C...</span>
                        </div>
                        <button 
                          onClick={simulatePing} 
                          disabled={pingStatus !== "idle"}
                          className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white"
                        >
                          {pingStatus === "idle" && <><Wifi className="h-3 w-3 text-cyan-400" /> Ping Node</>}
                          {pingStatus === "pinging" && <><Loader2 className="h-3 w-3 animate-spin text-amber-400" /> Pinging...</>}
                          {pingStatus === "online" && <><CheckCircle2 className="h-3 w-3 text-[#10b981]" /> Online</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Financial Flow Graph */}
                  <GraphComponent currentCandidate={currentCandidate} />

                  {/* Card 4: Product Image Match */}
                  <div className="col-span-1 flex flex-col rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-slate-500/50">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">Visual Artifact Fingerprint</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full border border-[#10b981]/30">
                        <CheckCircle2 className="h-3 w-3" /> YOLO BACKGROUND MATCH
                      </div>
                    </div>
                    <div className="flex flex-1 gap-3 overflow-hidden">
                      <InteractiveImage 
                        src={currentCandidate.aliasA?.image} 
                        title="Listing A" 
                        label="Alias A" 
                        onClick={() => setLightboxImage({ src: currentCandidate.aliasA?.image, title: `${currentCandidate.aliasA?.name} - Listing A` })}
                      />
                      <InteractiveImage 
                        src={currentCandidate.aliasB?.image} 
                        title="Listing B" 
                        label="Alias B" 
                        onClick={() => setLightboxImage({ src: currentCandidate.aliasB?.image, title: `${currentCandidate.aliasB?.name} - Listing B` })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function InteractiveImage({ src, title, label, onClick }: { src: string, title: string, label: string, onClick?: () => void }) {
  const [loupe, setLoupe] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLoupe({ x, y, width: rect.width || 1, height: rect.height || 1 });
  };

  return (
    <div 
      className="relative flex-1 overflow-hidden rounded-lg border border-slate-700 bg-black cursor-crosshair group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLoupe(null)}
      onClick={onClick}
    >
      <img src={src} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-50 transition-opacity" />
      
      {/* YOLO Bounding Box */}
      <div className="absolute left-[15%] top-[20%] w-[35%] h-[35%] border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(0,255,255,0.3)] group-hover:bg-cyan-400/30 transition-colors flex items-start justify-start">
         <span className="bg-cyan-400 text-black text-[7px] font-black px-1 uppercase opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 left-[-2px] whitespace-nowrap">
           digital_scale: 0.98 | IoU: 0.89
         </span>
      </div>

      <span className="absolute bottom-1 right-1 z-10 text-[9px] font-bold tracking-wider uppercase text-slate-300 bg-black/80 px-2 py-0.5 rounded border border-slate-700 pointer-events-none">{label}</span>
      
      {/* Magnifying Loupe */}
      {loupe && (
        <div 
          className="absolute w-16 h-16 rounded-full border-2 border-white pointer-events-none z-20 shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden"
          style={{ 
            left: loupe.x - 32, 
            top: loupe.y - 32,
            backgroundImage: `url(${src})`,
            backgroundPosition: `${(loupe.x / loupe.width) * 100}% ${(loupe.y / loupe.height) * 100}%`,
            backgroundSize: '300%'
          }}
        />
      )}
    </div>
  );
}

function GraphComponent({ currentCandidate }: { currentCandidate: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(getMiniGraphNodes(currentCandidate.aliasA?.name || "A", currentCandidate.aliasB?.name || "B", currentCandidate.cryptoWallet || "Wallet", currentCandidate.cryptoTotal || "$0"));
  const [edges, setEdges, onEdgesChange] = useEdgesState(getMiniGraphEdges());
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    setNodes(getMiniGraphNodes(currentCandidate.aliasA?.name || "A", currentCandidate.aliasB?.name || "B", currentCandidate.cryptoWallet || "Wallet", currentCandidate.cryptoTotal || "$0"));
  }, [currentCandidate, setNodes]);

  const onNodeClick = (_: React.MouseEvent, node: any) => {
    if (node.id === "C") setShowDrawer(true);
  };

  return (
    <div className="col-span-1 row-span-2 rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-slate-500/50 flex flex-col relative overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bitcoin className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Financial Flow</span>
        </div>
        <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
      </div>
      <p className="mb-4 text-[10px] font-medium text-slate-400 leading-relaxed">
        Crypto streams from both aliases converge into wallet <span className="font-mono text-white bg-white/10 px-1 rounded">{currentCandidate.cryptoWallet}</span> with deposits of <span className="text-[#10b981] font-bold">{currentCandidate.cryptoTotal}</span>.
      </p>
      
      <div className="relative flex-1 rounded-xl border border-slate-700 bg-black/40 overflow-hidden min-h-[280px]">
        <ReactFlowProvider>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView 
            proOptions={{ hideAttribution: true }}
            className="cursor-grab active:cursor-grabbing"
          >
            <Background color="#1e293b" gap={20} size={1.5} />
          </ReactFlow>
        </ReactFlowProvider>
        
        {/* Hover Analytics Drawer */}
        <AnimatePresence>
          {showDrawer && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 right-0 w-48 bg-[#0a0f18]/95 border-l border-slate-700 p-3 shadow-2xl backdrop-blur-xl z-20 flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Tx Ledgers</span>
                <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white"><X className="h-3 w-3"/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {txData.map((tx, i) => (
                  <div key={i} className="bg-black/50 border border-slate-800 rounded p-2">
                    <div className="text-[#10b981] text-xs font-bold mb-1">{tx.amount}</div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono"><ExternalLink className="h-2.5 w-2.5"/> {tx.hash}</div>
                    <div className="text-[8px] text-slate-500 mt-1 uppercase">{tx.time}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
