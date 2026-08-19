"use client";

import { useState, useEffect } from "react";
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
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

export default function IntelligenceDossier() {
  const activeEntityId = useAppStore((s) => s.activeEntityId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching for the dossier
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [activeEntityId]);

  if (!activeEntityId) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0B0F17] text-slate-500">
        No entity selected.
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

  // --- Mock Data based on Entity ---
  const entityName = activeEntityId.startsWith("bc1") ? activeEntityId : `${activeEntityId}`;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full overflow-y-auto bg-[#0B0F17] p-8 hide-scrollbar text-slate-200"
    >
      <div className="mx-auto max-w-[1400px] space-y-6">
        
        {/* Panel 1: Master Entity Header & Threat Gauge */}
        <div className="flex items-stretch gap-6">
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
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
                    Source: Darknet
                  </span>
                  <span className="rounded bg-[#FF4500]/10 px-2 py-1 text-[10px] font-semibold text-[#FF4500] uppercase tracking-wider">
                    Category: Opioids/Fentanyl
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-400 font-mono">
                    First Detected: 2024-03-12
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-400 font-mono">
                    Last Active: 2026-08-17 14:32:00
                  </span>
                </div>
                <div className="max-w-2xl text-sm leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-300">AI Summary:</span> High-volume Fentanyl distribution linked to multi-sig escrow wallets. Frequent vendor on AlphaBay Reborn. Shows sophisticated OPSEC with automated mixing services.
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
                  <span className="text-2xl font-black text-white">94</span>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Critical</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 pt-6 border-t border-slate-800/50">
              <button className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-cyan-500">
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white">
                <FolderPlus className="h-3.5 w-3.5" />
                Add to Case
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white">
                <FileText className="h-3.5 w-3.5" />
                Evidence Log
              </button>
            </div>
          </div>
        </div>

        {/* Panel 2: Cross-Source Entity Correlation Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50" />
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Linked Crypto</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-slate-800">
                <span className="text-[10px] font-mono text-slate-300 truncate w-32">bc1q9h...x4k2</span>
                <span className="text-[10px] font-bold text-emerald-400">12.4 BTC</span>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-slate-800">
                <span className="text-[10px] font-mono text-slate-300 truncate w-32">42xM7...p9L</span>
                <span className="text-[10px] font-bold text-emerald-400">850 XMR</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50" />
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Known Aliases</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-slate-800">
                <span className="text-xs font-bold text-slate-200">DarkPhoenix_77</span>
                <span className="text-[9px] text-cyan-500 uppercase">AlphaBay</span>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-slate-800">
                <span className="text-xs font-bold text-slate-200">DP_Supply</span>
                <span className="text-[9px] text-cyan-500 uppercase">Dread</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50" />
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Encrypted Comms</h3>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col justify-center bg-black/20 p-2 rounded border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase">Session ID</span>
                <span className="text-[10px] font-mono text-purple-300 truncate">056c8...f9a1</span>
              </div>
              <div className="flex flex-col justify-center bg-black/20 p-2 rounded border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase">Telegram</span>
                <span className="text-[10px] font-bold text-purple-300">@Ghost_Supply</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50" />
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">PGP Fingerprint</h3>
            </div>
            <div className="flex h-full flex-col mt-2">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 mb-2">
                F9B2 4A32 1109 E77A
              </span>
              <div className="flex items-center gap-1.5 mt-auto">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400">Verified Match (3 platforms)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel 3: Chronological Evidence */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-4">
              <Clock className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Chronological Evidence Audit</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-400">
                <thead>
                  <tr className="border-b border-slate-800 uppercase tracking-wider text-[10px] text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">Timestamp</th>
                    <th className="pb-3 pr-4 font-semibold">Event Type</th>
                    <th className="pb-3 pr-4 font-semibold">Source</th>
                    <th className="pb-3 pr-4 font-semibold">Evidence Artifact</th>
                    <th className="pb-3 text-right font-semibold">Risk Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="transition-colors hover:bg-slate-800/30">
                    <td className="py-3 pr-4 font-mono text-[10px]">2026-08-17 14:32</td>
                    <td className="py-3 pr-4 font-semibold text-white">Bulk Listing Created</td>
                    <td className="py-3 pr-4"><span className="text-cyan-400">AlphaBay Reborn</span></td>
                    <td className="py-3 pr-4 text-slate-300">500g Fentanyl HCL</td>
                    <td className="py-3 text-right font-bold text-red-500">+15</td>
                  </tr>
                  <tr className="transition-colors hover:bg-slate-800/30">
                    <td className="py-3 pr-4 font-mono text-[10px]">2026-08-16 09:11</td>
                    <td className="py-3 pr-4 font-semibold text-white">Wallet Sweep</td>
                    <td className="py-3 pr-4"><span className="text-amber-400">Blockchain</span></td>
                    <td className="py-3 pr-4 text-slate-300">2.45 BTC to Mixing Service</td>
                    <td className="py-3 text-right font-bold text-red-500">+20</td>
                  </tr>
                  <tr className="transition-colors hover:bg-slate-800/30">
                    <td className="py-3 pr-4 font-mono text-[10px]">2026-08-14 22:05</td>
                    <td className="py-3 pr-4 font-semibold text-white">Comms Intercept</td>
                    <td className="py-3 pr-4"><span className="text-purple-400">Telegram</span></td>
                    <td className="py-3 pr-4 text-slate-300">"Tracking number 1Z9..."</td>
                    <td className="py-3 text-right font-bold text-orange-400">+10</td>
                  </tr>
                  <tr className="transition-colors hover:bg-slate-800/30">
                    <td className="py-3 pr-4 font-mono text-[10px]">2026-08-10 11:20</td>
                    <td className="py-3 pr-4 font-semibold text-white">Key Rotation</td>
                    <td className="py-3 pr-4"><span className="text-emerald-400">OSINT / Dread</span></td>
                    <td className="py-3 pr-4 text-slate-300">New PGP public key posted</td>
                    <td className="py-3 text-right font-bold text-yellow-500">+5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            {/* Panel 4: Network Relationship Mini-Graph */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg backdrop-blur-md flex flex-col h-64">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">Network</h2>
                </div>
                <button className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                  Full Graph <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 relative rounded-lg border border-slate-800 bg-[#0B0F17] overflow-hidden flex items-center justify-center">
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
                <div className="absolute top-1/4 right-1/4 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center z-10">
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
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-4">
                <Hash className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Chain of Custody</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Dossier SHA-256 Hash</div>
                  <div className="bg-black/30 border border-slate-800 rounded p-2 text-[9px] font-mono text-slate-300 break-all">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Access Audit Log</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Eye className="w-3 h-3 text-cyan-500" />
                        Agent Torres (Cyber Div)
                      </div>
                      <span className="text-slate-500">Just now</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Download className="w-3 h-3 text-slate-500" />
                        System Auto-Archive
                      </div>
                      <span className="text-slate-500">2h ago</span>
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
