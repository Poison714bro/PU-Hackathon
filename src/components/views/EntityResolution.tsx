"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ExternalLink
} from "lucide-react";
import ReactFlow, { Background, MarkerType, useNodesState, useEdgesState, BaseEdge, EdgeProps, getSmoothStepPath, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceArea, XAxis, Tooltip as RechartsTooltip } from "recharts";

import { api } from "@/lib/apiClient";
import { EmptyState } from "@/components/ui/EmptyState";

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

// --- MOCK DATA FOR RECHARTS ---
const sparklineData = [
  { time: "0h", a: 80, b: 0 },
  { time: "12h", a: 75, b: 0 },
  { time: "24h", a: 90, b: 0 }, // AlphaBay listing offline
  { time: "36h", a: 0, b: 0 }, // Gap
  { time: "48h", a: 0, b: 0 }, // Gap
  { time: "60h", a: 0, b: 0 }, // Gap
  { time: "72h", a: 0, b: 85 }, // Hydra listing online
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

  const [isMerging, setIsMerging] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "warning" }[]>([]);
  const [toastId, setToastId] = useState(0);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);
  
  const [pingStatus, setPingStatus] = useState<"idle" | "pinging" | "online">("idle");
  const [showRadar, setShowRadar] = useState(false);

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

  const handleMergePersonas = useCallback(() => {
    if (isMerging || candidates.length === 0) return;
    setIsMerging(true);
    setTimeout(() => {
      setIsMerging(false);
      addToast("Personas merged successfully", "success");
      removeCurrentAndAdvance();
    }, 1500);
  }, [isMerging, candidates.length, addToast, removeCurrentAndAdvance]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < candidates.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, candidates.length]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        handleMergePersonas();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        handleFlagFalsePositive();
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMergePersonas, handleFlagFalsePositive, handleNext, handlePrevious]);

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

  if (candidates.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[var(--background)] text-muted-foreground relative">
        <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md ${toast.type === 'success' ? 'border-primary/30 bg-card/80' : 'border-[#ff5572]/30 bg-card/80'}`}
              >
                {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XOctagon className="h-4 w-4 text-[#ff5572]" />}
                <span className={`text-xs font-bold uppercase tracking-wider ${toast.type === 'success' ? 'text-white' : 'text-[#ff5572]'}`}>{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <EmptyState icon={SearchX} title="No Candidates Found" description="The AI Entity Resolution engine has not identified any aliases that exceed the match confidence threshold." />
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

      {/* Full-screen Image Lightbox */}
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

      {/* 1. Candidate Triage Bar (Top) */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-[#0a0f18]/90 px-6 py-3 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-slate-700/50 rounded-md bg-[#0f111a]/50 px-2 py-1 backdrop-blur-sm">
             <button 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-[#0a0f18] disabled:opacity-30 hover:text-white group relative"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-black px-2 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">← Left Arrow</span>
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
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-black px-2 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Right Arrow →</span>
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
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-black px-2 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none text-white">Cmd/Ctrl + F</span>
          </button>
          
          <div className="relative group">
            {/* Glowing Pulse behind Confirm Button */}
            <div className="absolute -inset-1 rounded-lg bg-[#10b981] opacity-20 blur-sm group-hover:animate-pulse transition-all"></div>
            <button 
              onClick={handleMergePersonas}
              disabled={isMerging}
              className="relative flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#10b981] to-emerald-500 px-4 py-1.5 text-xs font-black text-[#070a10] uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:ring-offset-2 focus:ring-offset-[#0a0f18] disabled:opacity-70 min-w-[250px]"
            >
              {isMerging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Merge className="h-4 w-4" />}
              {isMerging ? 'Merging Personas...' : 'Confirm Match & Merge'}
            </button>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-black px-2 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none text-white z-50">Cmd/Ctrl + M</span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* 2. Suspect Header & Match Gauge (Glassmorphism) */}
        <div className="relative flex items-stretch gap-6">
          {/* Alias A */}
          <div className="flex-1 rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-slate-600/80">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-[#a855f7]/20 border border-[#a855f7]/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d8b4fe] shadow-[0_0_10px_rgba(168,85,247,0.2)]">Alias A</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/20 px-2 py-1 rounded">Active: {currentCandidate.aliasA.joinDate}</span>
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate tracking-tight">{currentCandidate.aliasA.name}</h2>
            <p className="text-sm font-bold text-cyan-400 mt-2">{currentCandidate.aliasA.market}</p>
          </div>

          {/* Central Gauge & Expanded Score */}
          <div className="w-[320px] shrink-0 flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Background Radar Sweep Animation */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex justify-center items-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-full h-full rounded-full border-t-2 border-emerald-500 absolute" style={{ filter: "blur(2px)" }}></motion.div>
            </div>
            
            <div className="relative z-10 flex items-center gap-6 w-full">
              {/* Circular Gauge */}
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-black/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-slate-800">
                <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path className="stroke-slate-800" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <motion.path
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${parseInt(currentCandidate.confidence)}, 100` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="stroke-[#10b981] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    strokeWidth="3" fill="none" strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{currentCandidate.confidence}</span>
                </div>
              </div>
              
              {/* Score Breakdown */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Crypto</span>
                  <span className="text-[#10b981] bg-[#10b981]/10 px-1.5 rounded border border-[#10b981]/20">100%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">PGP</span>
                  <span className="text-[#10b981] bg-[#10b981]/10 px-1.5 rounded border border-[#10b981]/20">100%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Vision</span>
                  <span className="text-[#10b981] bg-[#10b981]/10 px-1.5 rounded border border-[#10b981]/20">{currentCandidate.visionScore}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">NLP</span>
                  <span className="text-emerald-400 bg-emerald-400/10 px-1.5 rounded border border-emerald-400/20">{currentCandidate.nlpScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alias B */}
          <div className="flex-1 rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-slate-600/80">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-[#a855f7]/20 border border-[#a855f7]/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d8b4fe] shadow-[0_0_10px_rgba(168,85,247,0.2)]">Alias B</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-black/20 px-2 py-1 rounded">Active: {currentCandidate.aliasB.joinDate}</span>
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate tracking-tight">{currentCandidate.aliasB.name}</h2>
            <p className="text-sm font-bold text-cyan-400 mt-2">{currentCandidate.aliasB.market}</p>
          </div>
        </div>

        {/* 3. D3/Recharts Sparkline Timeline */}
        <div className="flex items-center justify-between gap-6 rounded-xl border border-slate-700/50 bg-[#0f111a]/60 p-4 shadow-xl backdrop-blur-md">
          <div className="shrink-0 flex items-center gap-3">
             <div className="p-2 bg-[#a855f7]/10 rounded-lg border border-[#a855f7]/20">
               <Activity className="h-5 w-5 text-[#a855f7]" />
             </div>
             <div>
               <h3 className="text-xs font-bold text-white uppercase tracking-widest">Temporal Correlation</h3>
               <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">48-Hour Extinction Gap Detected</p>
             </div>
          </div>
          <div className="h-12 flex-1 max-w-xl">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="time" hide />
                 <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #1e293b', fontSize: '10px' }} />
                 <ReferenceArea x1="36h" x2="60h" fill="#ef4444" fillOpacity={0.15} />
                 <Area type="monotone" dataKey="a" stroke="#a855f7" strokeWidth={2} fill="url(#colorA)" isAnimationActive={true} />
                 <Area type="monotone" dataKey="b" stroke="#10b981" strokeWidth={2} fill="url(#colorB)" isAnimationActive={true} />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Enhanced 5-Vector Verification Matrix */}
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">5-Vector Automated Proofs Matrix</h3>
          <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest flex items-center gap-1.5 bg-[#10b981]/10 px-3 py-1 rounded-full border border-[#10b981]/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"><ShieldCheck className="h-3 w-3" /> System Verified</span>
        </div>
        
        <div className="grid grid-cols-3 gap-6 pb-12">
          
          {/* Card 1: Crypto Proof (PGP) */}
          <div className="col-span-1 flex flex-col rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-slate-500/50 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Cryptographic Proof</span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
            </div>
            <div className="flex items-center justify-between gap-2 mb-4">
               <div className="flex items-center gap-2">
                 <span className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">RSA 4096-bit</span>
                 <span className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-bold text-foreground border border-slate-700">ID: 0xF9B24A32</span>
               </div>
            </div>
            
            {/* Key Entropy Progress */}
            <div className="mb-4">
               <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider mb-1">
                 <span className="text-slate-400">Key Entropy Score</span>
                 <span className="text-emerald-400">96.4% / Excellent</span>
               </div>
               <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '96.4%' }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"></motion.div>
               </div>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-end">
              <div className="group cursor-pointer relative" onClick={() => handleCopy(currentCandidate.aliasA.pgp, 'pgp-a')}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alias A PGP Block</span>
                  {copiedId === 'pgp-a' ? <span className="text-[9px] text-[#10b981] font-bold uppercase">Copied!</span> : <Copy className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <p className={`font-mono text-[10px] text-slate-300 bg-black/40 p-2.5 rounded-lg border border-slate-700/50 truncate transition-colors ${copiedId === 'pgp-a' ? 'text-[#10b981] border-[#10b981]/50' : 'group-hover:border-cyan-500/50'}`}>
                  {currentCandidate.aliasA.pgp}
                </p>
              </div>
              <div className="group cursor-pointer relative" onClick={() => handleCopy(currentCandidate.aliasB.pgp, 'pgp-b')}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alias B PGP Block</span>
                  {copiedId === 'pgp-b' ? <span className="text-[9px] text-white font-bold uppercase">Copied!</span> : <Copy className="h-3 w-3 text-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <p className={`font-mono text-[10px] text-[#10b981] bg-[#10b981]/10 p-2.5 rounded-lg border border-[#10b981]/30 truncate transition-colors ${copiedId === 'pgp-b' ? 'text-white border-white bg-[#10b981]/30' : 'group-hover:border-[#10b981]'}`}>
                  {currentCandidate.aliasB.pgp}
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
              <div 
                className="flex items-center justify-between bg-gradient-to-r from-[#10b981]/10 to-transparent border border-[#10b981]/30 rounded-lg p-3 cursor-pointer group transition-colors hover:from-[#10b981]/20 hover:border-[#10b981]/50 relative overflow-hidden"
                onClick={() => handleCopy("593A1B2C", 'tox')}
              >
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tox ID (Match)</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${copiedId === 'tox' ? 'text-white' : 'text-[#10b981]'}`}>593A1B2C...</span>
                    {copiedId === 'tox' ? <span className="text-[9px] text-white font-bold uppercase bg-white/20 px-1 rounded">Copied</span> : <Copy className="h-3 w-3 text-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </div>
                {/* Ping Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); simulatePing(); }}
                  className="p-2 rounded-full bg-black/40 border border-slate-700 hover:bg-black/60 transition-colors"
                  title="Ping Socket"
                >
                  {pingStatus === "idle" && <Wifi className="h-4 w-4 text-slate-400" />}
                  {pingStatus === "pinging" && <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />}
                  {pingStatus === "online" && <Wifi className="h-4 w-4 text-[#10b981]" />}
                </button>
              </div>
              <div className="flex items-center justify-between bg-black/30 border border-slate-800 rounded-lg p-3 opacity-60">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Session ID</span>
                <span className="font-mono text-xs text-slate-600">None detected</span>
              </div>
              <div className="flex items-center justify-between bg-black/30 border border-slate-800 rounded-lg p-3 opacity-60">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Jabber/XMPP</span>
                <span className="font-mono text-xs text-slate-600">None detected</span>
              </div>
            </div>
          </div>

          {/* Card 5: Financial Flow (Mini-Graph) */}
          <GraphComponent currentCandidate={currentCandidate} />

          {/* Card 3: Stylometric NLP */}
          <div className="col-span-1 rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-slate-500/50 flex flex-col relative group">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Stylometric NLP Diff</span>
              </div>
              <div className="relative">
                <span 
                  className="text-[11px] font-black text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-md border border-[#10b981]/30 cursor-help"
                  onMouseEnter={() => setShowRadar(true)}
                  onMouseLeave={() => setShowRadar(false)}
                >
                  {currentCandidate.nlpScore}
                </span>
                {/* Radar Chart Popover */}
                <AnimatePresence>
                  {showRadar && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 h-56 bg-[#0a0f18] border border-slate-700 rounded-xl shadow-2xl z-50 p-2"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                          <Radar name="Alias A" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                          <Radar name="Alias B" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 flex-1 justify-center">
              {/* Rich Text Diff Views */}
              <div className="rounded-lg border border-slate-700/50 bg-black/40 p-3 relative overflow-hidden">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-slate-400">Alias A Source</span>
                <div className="text-xs leading-relaxed text-slate-300 font-serif">
                  <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded-sm">Premium product.</span> <span className="bg-yellow-500/20 text-yellow-400 px-1 rounded-sm">Strictly encrypted comms</span> only. No time wasters.
                </div>
              </div>
              <div className="flex justify-center -my-3 z-10 relative">
                 <div className="bg-slate-800 p-1 rounded-full border border-slate-700">
                    <Merge className="h-3 w-3 text-slate-400 rotate-90" />
                 </div>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-black/40 p-3 relative overflow-hidden">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-slate-400">Alias B Source</span>
                <div className="text-xs leading-relaxed text-slate-300 font-serif">
                  <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded-sm">Premium product.</span> <span className="bg-yellow-500/20 text-yellow-400 px-1 rounded-sm">Strictly encrypted comms</span> prefered. Serious inquiries.
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Advanced Visual Computer Vision */}
          <div className="col-span-1 rounded-2xl border border-slate-700/50 bg-[#0f111a]/60 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-slate-500/50 flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Visual Computer Vision</span>
              </div>
              <span className="text-[11px] font-black text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-md border border-[#10b981]/30">{currentCandidate.visionScore}</span>
            </div>
            <p className="mb-4 text-[10px] font-medium text-slate-400 leading-relaxed">
              YOLOv8 detected <span className="text-white font-bold">digital_scale (IoU: 0.89)</span> and background grain match. Hover to inspect.
            </p>
            
            <div className="flex gap-4 h-36 mt-auto">
              {/* Interactive Image A */}
              <InteractiveImage src={currentCandidate.aliasA.image} title="Listing A" label="Alias A" />
              {/* Interactive Image B */}
              <InteractiveImage src={currentCandidate.aliasB.image} title="Listing B" label="Alias B" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function InteractiveImage({ src, title, label }: { src: string, title: string, label: string }) {
  const [loupe, setLoupe] = useState<{x: number, y: number} | null>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLoupe({ x, y });
  };

  return (
    <div 
      className="relative flex-1 overflow-hidden rounded-lg border border-slate-700 bg-black cursor-crosshair group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLoupe(null)}
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
            backgroundPosition: `${(loupe.x / 140) * 100}% ${(loupe.y / 140) * 100}%`,
            backgroundSize: '300%'
          }}
        />
      )}
    </div>
  );
}

function GraphComponent({ currentCandidate }: { currentCandidate: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(getMiniGraphNodes(currentCandidate.aliasA.name, currentCandidate.aliasB.name, currentCandidate.cryptoWallet, currentCandidate.cryptoTotal));
  const [edges, setEdges, onEdgesChange] = useEdgesState(getMiniGraphEdges());
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    setNodes(getMiniGraphNodes(currentCandidate.aliasA.name, currentCandidate.aliasB.name, currentCandidate.cryptoWallet, currentCandidate.cryptoTotal));
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
