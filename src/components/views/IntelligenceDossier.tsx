"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Download, 
  FolderPlus, 
  FileText, 
  Wallet, 
  User, 
  MessageSquare, 
  Key, 
  Activity, 
  Link as LinkIcon, 
  Hash, 
  Eye, 
  Clock,
  ArrowRight,
  Archive,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/apiClient";
import { EmptyState } from "@/components/ui/EmptyState";

export default function IntelligenceDossier() {
  const activeEntityId = useAppStore((s) => s.activeEntityId);
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function loadDossier() {
      if (!activeEntityId) return;
      setLoading(true);
      const res = await api.intelligence.dossier(activeEntityId);
      if (cancelled) return;
      if (res.ok && res.data) {
        setDossier(res.data);
      }
      setLoading(false);
    }
    loadDossier();
    return () => { cancelled = true; };
  }, [activeEntityId]);

  if (!activeEntityId) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background)]">
        <EmptyState
          icon={Database}
          title="No Entity Selected"
          description="Select an entity from the map, graph, or investigations board to view their complete intelligence dossier."
        />
      </div>
    );
  }

  // --- Skeletons ---
  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[#0B0F17] p-8 hide-scrollbar">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-40 w-full animate-pulse rounded-xl bg-slate-900/50" />
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-900/50" />
            ))}
          </div>
          <div className="h-64 w-full animate-pulse rounded-xl bg-slate-900/50" />
          <div className="h-48 w-full animate-pulse rounded-xl bg-slate-900/50" />
        </div>
      </div>
    );
  }

  // --- Dynamic Data based on Entity ---
  const entityName = dossier?.entity?.primaryAlias || activeEntityId;
  const riskScore = dossier?.threatScore || 0;
  const category = dossier?.entity?.category || "Unknown";
  const source = "Intel System"; // Real backend doesn't explicitly return source, fallback
  const firstDetected = dossier?.timeline?.[0]?.timestamp || "Unknown";
  const lastActive = dossier?.timeline?.[dossier?.timeline?.length - 1]?.timestamp || "Unknown";
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full overflow-y-auto bg-[#0B0F17] p-8 hide-scrollbar text-foreground"
    >
      <div className="mx-auto max-w-[1400px] space-y-6">
        
        {/* Panel 1: Master Entity Header & Threat Gauge */}
        <div className="flex items-stretch gap-6">
          <div className="flex-1 rounded-xl border border-border bg-slate-900/40 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-white">{entityName}</h1>
                  <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-500 border border-red-500/20">
                    High Risk
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Source: {source}
                  </span>
                  <span className="rounded bg-[#FF4500]/10 px-2 py-1 text-[10px] font-semibold text-[#FF4500] uppercase tracking-wider">
                    Category: {category}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-[10px] text-muted-foreground font-mono">
                    First Detected: {firstDetected}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-[10px] text-muted-foreground font-mono">
                    Last Active: {lastActive}
                  </span>
                </div>
                <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">AI Summary:</span> {dossier?.entity?.description || "No AI summary available."}
                </div>
              </div>

              {/* Threat Gauge */}
              <div className="flex flex-col items-center justify-center shrink-0 w-32 h-32 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path
                    className="text-slate-800"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <motion.path
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: "94, 100" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{riskScore}</span>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{dossier?.classification || "Unknown"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 pt-6 border-t border-border/50">
              <button className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                <FolderPlus className="h-3.5 w-3.5" />
                Add to Case
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                <FileText className="h-3.5 w-3.5" />
                Evidence Log
              </button>
            </div>
          </div>
        </div>

        {/* Panel 2: Cross-Source Entity Correlation Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-slate-900/40 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50" />
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Linked Crypto</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-border">
                <span className="text-[10px] font-mono text-foreground truncate w-32">bc1q9h...x4k2</span>
                <span className="text-[10px] font-bold text-emerald-400">12.4 BTC</span>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-border">
                <span className="text-[10px] font-mono text-foreground truncate w-32">42xM7...p9L</span>
                <span className="text-[10px] font-bold text-emerald-400">850 XMR</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-slate-900/40 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50" />
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Known Aliases</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-border">
                <span className="text-xs font-bold text-foreground">DarkPhoenix_77</span>
                <span className="text-[9px] text-cyan-500 uppercase">AlphaBay</span>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-border">
                <span className="text-xs font-bold text-foreground">DP_Supply</span>
                <span className="text-[9px] text-cyan-500 uppercase">Dread</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-slate-900/40 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50" />
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Encrypted Comms</h3>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col justify-center bg-black/20 p-2 rounded border border-border">
                <span className="text-[9px] text-muted-foreground uppercase">Session ID</span>
                <span className="text-[10px] font-mono text-purple-300 truncate">056c8...f9a1</span>
              </div>
              <div className="flex flex-col justify-center bg-black/20 p-2 rounded border border-border">
                <span className="text-[9px] text-muted-foreground uppercase">Telegram</span>
                <span className="text-[10px] font-bold text-purple-300">@Ghost_Supply</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-slate-900/40 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50" />
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PGP Fingerprint</h3>
            </div>
            <div className="flex h-full flex-col mt-2">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 mb-2">
                F9B2 4A32 1109 E77A
              </span>
              <div className="flex items-center gap-1.5 mt-auto">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-muted-foreground">Verified Match (3 platforms)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel 3: Chronological Evidence */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-slate-900/40 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Chronological Evidence Audit</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead>
                  <tr className="border-b border-border uppercase tracking-wider text-[10px] text-muted-foreground">
                    <th className="pb-3 pr-4 font-semibold">Timestamp</th>
                    <th className="pb-3 pr-4 font-semibold">Event Type</th>
                    <th className="pb-3 pr-4 font-semibold">Source</th>
                    <th className="pb-3 pr-4 font-semibold">Evidence Artifact</th>
                    <th className="pb-3 text-right font-semibold">Risk Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {dossier?.timeline?.map((event: any, i: number) => (
                    <tr key={i} className="transition-colors hover:bg-slate-800/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                      <td className="py-3 pr-4 font-mono text-[10px]">{event.timestamp.replace("T", " ")}</td>
                      <td className="py-3 pr-4 font-semibold text-white">{event.eventType}</td>
                      <td className="py-3 pr-4"><span className="text-primary">{event.source}</span></td>
                      <td className="py-3 pr-4 text-foreground">{event.description}</td>
                      <td className="py-3 text-right font-bold text-red-500">+{event.riskDelta || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            {/* Panel 4: Network Relationship Mini-Graph */}
            <div className="rounded-xl border border-border bg-slate-900/40 p-6 shadow-lg backdrop-blur-md flex flex-col h-64">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">Network</h2>
                </div>
                <button className="text-[10px] font-bold text-cyan-500 hover:text-primary flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                  Full Graph <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 relative rounded-lg border border-border bg-[#0B0F17] overflow-hidden flex items-center justify-center">
                {/* Simulated Graph Vis */}
                <div className="absolute w-full h-full opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#0B0F17] to-[#0B0F17]" />
                
                {/* Central Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center z-20 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  <User className="w-5 h-5 text-red-500" />
                </div>

                {/* Satellite Nodes */}
                <div className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center z-10">
                  <Wallet className="w-3 h-3 text-amber-500" />
                </div>
                <div className="absolute top-1/4 right-1/4 w-8 h-8 rounded-full bg-cyan-500/20 border border-primary flex items-center justify-center z-10">
                  <User className="w-3 h-3 text-cyan-500" />
                </div>
                <div className="absolute bottom-1/4 left-1/3 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center z-10">
                  <MessageSquare className="w-3 h-3 text-purple-500" />
                </div>

                {/* Edges */}
                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                  <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="#475569" strokeWidth="1" strokeDasharray="4" />
                  <line x1="75%" y1="25%" x2="50%" y2="50%" stroke="#475569" strokeWidth="1" strokeDasharray="4" />
                  <line x1="33%" y1="75%" x2="50%" y2="50%" stroke="#475569" strokeWidth="1" strokeDasharray="4" />
                </svg>
              </div>
            </div>

            {/* Panel 5: Chain of Custody & Legal */}
            <div className="rounded-xl border border-border bg-slate-900/40 p-6 shadow-lg backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Chain of Custody</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Dossier SHA-256 Hash</div>
                  <div className="bg-black/30 border border-border rounded p-2 text-[9px] font-mono text-foreground break-all">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Access Audit Log</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Eye className="w-3 h-3 text-cyan-500" />
                        Agent Torres (Cyber Div)
                      </div>
                      <span className="text-muted-foreground">Just now</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Download className="w-3 h-3 text-muted-foreground" />
                        System Auto-Archive
                      </div>
                      <span className="text-muted-foreground">2h ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
