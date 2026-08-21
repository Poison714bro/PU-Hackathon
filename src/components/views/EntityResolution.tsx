"use client";

import { useState } from "react";
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
  ShieldCheck
} from "lucide-react";
import ReactFlow, { Background, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { SOURCE_STREAM_COLORS } from "@/lib/utils";

const MOCK_CANDIDATES = [
  {
    aliasA: {
      name: "ShadowPharm",
      market: "Hydra Market",
      pgp: "F9B2 4A32 1109 E77A",
      joinDate: "2023-11-04",
      description: "Premium grade pharmaceuticals. Stealth packaging guaranteed. Reship policy applies to tracked orders only.",
    },
    aliasB: {
      name: "BlueSkyDistro",
      market: "AlphaBay Reborn",
      pgp: "F9B2 4A32 1109 E77A", 
      joinDate: "2025-01-12",
      description: "Top tier pharms. Stealth packaging guaranteed. Reship policy applies to tracked orders only. No refunds.",
    },
    confidence: "96%",
    nlpScore: "89%",
    visionScore: "94%"
  },
  {
    aliasA: {
      name: "ChemCartel",
      market: "Dream Market",
      pgp: "A12F 99B2 C441 D882",
      joinDate: "2021-05-18",
      description: "Bulk orders only. Escrow accepted.",
    },
    aliasB: {
      name: "BulkChemz",
      market: "Torrez Market",
      pgp: "A12F 99B2 C441 D882",
      joinDate: "2023-08-22",
      description: "Bulk RC supplier. Escrow only.",
    },
    confidence: "91%",
    nlpScore: "82%",
    visionScore: "88%"
  },
  {
    aliasA: {
      name: "KushKing",
      market: "White House Market",
      pgp: "88D2 11F4 EEE1 90A1",
      joinDate: "2022-09-10",
      description: "Best buds on the east coast. Next day delivery.",
    },
    aliasB: {
      name: "EastCoastBuds",
      market: "Versus Project",
      pgp: "88D2 11F4 EEE1 90A1",
      joinDate: "2024-02-05",
      description: "Premium buds. East coast. NDD available.",
    },
    confidence: "98%",
    nlpScore: "95%",
    visionScore: "97%"
  }
];

const blockchainColor = SOURCE_STREAM_COLORS.Blockchain;

const getMiniGraphNodes = (aliasA: string, aliasB: string) => [
  { id: "A", position: { x: 30, y: 30 }, data: { label: aliasA }, style: { background: "#070a10", color: "#fff", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "9px", width: 100 } },
  { id: "B", position: { x: 30, y: 130 }, data: { label: aliasB }, style: { background: "#070a10", color: "#fff", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "9px", width: 100 } },
  { id: "C", position: { x: 180, y: 80 }, data: { label: "bc1q9h...x4k2\n$48,200" }, style: { background: blockchainColor, color: "#070a10", border: "none", borderRadius: "8px", fontSize: "9px", fontWeight: "bold", width: 100 } },
];

const miniGraphEdges = [
  { id: "e1", source: "A", target: "C", animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: blockchainColor }, style: { stroke: blockchainColor } },
  { id: "e2", source: "B", target: "C", animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: blockchainColor }, style: { stroke: blockchainColor } },
];

export default function EntityResolution() {
  const [matchStatus, setMatchStatus] = useState<"pending" | "merged" | "rejected">("pending");
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setMatchStatus("pending");
    }
  };

  const handleNext = () => {
    if (currentIndex < MOCK_CANDIDATES.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setMatchStatus("pending");
    }
  };

  const currentCandidate = MOCK_CANDIDATES[currentIndex];
  const miniGraphNodes = getMiniGraphNodes(currentCandidate.aliasA.name, currentCandidate.aliasB.name);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background text-foreground custom-scrollbar">
      
      {/* 1. Candidate Triage Bar (Top) */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-6 py-3 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-border rounded-md bg-card px-2 py-1">
             <button 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background ${currentIndex === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-muted-foreground hover:text-white'}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
             <span className="text-xs font-bold text-white uppercase tracking-wider">
               Reviewing Candidate {currentIndex + 1} of {MOCK_CANDIDATES.length}
             </span>
             <button 
                onClick={handleNext}
                disabled={currentIndex === MOCK_CANDIDATES.length - 1}
                className={`p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background ${currentIndex === MOCK_CANDIDATES.length - 1 ? 'text-slate-700 cursor-not-allowed' : 'text-muted-foreground hover:text-white'}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
          </div>
          <div className="flex items-center gap-2 border border-border rounded-md bg-card px-3 py-1.5 cursor-pointer hover:bg-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Confidence: &gt;90%</span>
          </div>
        </div>
        
        {matchStatus === "pending" ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMatchStatus("rejected")}
              className="flex items-center gap-2 rounded-md border border-[#ff5572] bg-transparent px-4 py-1.5 text-xs font-bold text-destructive uppercase tracking-wider transition-all hover:bg-[#ff5572]/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
            >
              <XOctagon className="h-4 w-4" />
              Flag False Positive
            </button>
            <button 
              onClick={() => setMatchStatus("merged")}
              className="flex items-center gap-2 rounded-md bg-[#10b981] px-4 py-1.5 text-xs font-bold text-[#070a10] uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
            >
              <Merge className="h-4 w-4" />
              Confirm Match & Merge Personas
            </button>
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${matchStatus === 'merged' ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30' : 'bg-[#ff5572]/20 text-destructive border border-[#ff5572]/30'}`}>
            {matchStatus === 'merged' ? <CheckCircle2 className="h-4 w-4" /> : <XOctagon className="h-4 w-4" />}
            {matchStatus === 'merged' ? 'Personas Merged' : 'Flagged as False Positive'}
          </div>
        )}
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full">
        {/* 2. Suspect Header & Match Gauge */}
        <div className="relative flex items-stretch gap-6 mb-4">
          {/* Alias A */}
          <div className="flex-1 rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-[#1e293b] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#a855f7]">Alias A</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Active: {currentCandidate.aliasA.joinDate}</span>
            </div>
            <h2 className="text-2xl font-black text-white truncate" title={currentCandidate.aliasA.name}>{currentCandidate.aliasA.name}</h2>
            <p className="text-sm font-bold text-primary mt-1">{currentCandidate.aliasA.market}</p>
          </div>

          {/* Central Gauge & Expanded Score */}
          <div className="w-[300px] shrink-0 flex flex-col items-center justify-center rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="flex items-center gap-4 w-full">
              {/* Circular Gauge */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-background shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-2 ring-[#1e293b]">
                <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-[#1e293b]"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-[#10b981] drop-shadow-md transition-all duration-1000"
                    strokeWidth="3"
                    strokeDasharray={`${parseInt(currentCandidate.confidence)}, 100`}
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-black text-[#10b981]">{currentCandidate.confidence}</span>
                </div>
              </div>
              
              {/* Score Breakdown */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Crypto</span>
                  <span className="text-[#10b981]">100%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">PGP</span>
                  <span className="text-[#10b981]">100%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Vision</span>
                  <span className="text-[#10b981]">{currentCandidate.visionScore}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">NLP</span>
                  <span className="text-emerald-400">{currentCandidate.nlpScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alias B */}
          <div className="flex-1 rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-[#1e293b] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#a855f7]">Alias B</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Active: {currentCandidate.aliasB.joinDate}</span>
            </div>
            <h2 className="text-2xl font-black text-white truncate" title={currentCandidate.aliasB.name}>{currentCandidate.aliasB.name}</h2>
            <p className="text-sm font-bold text-primary mt-1">{currentCandidate.aliasB.market}</p>
          </div>
        </div>

        {/* 3. Temporal Bridge Banner */}
        <div className="mb-6 flex items-center justify-center gap-3 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 px-4 py-2 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <Activity className="h-4 w-4 text-[#a855f7]" />
          <span className="text-xs font-bold text-[#a855f7] uppercase tracking-widest">
            Temporal Correlation: 48-Hour Migration Window detected between Hydra exit and AlphaBay listing creation.
          </span>
        </div>

        {/* 4. Enhanced 5-Vector Verification Matrix */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">5-Vector Verification Matrix</h3>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Automated Proofs</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pb-8">
          
          {/* Card 1: Crypto Proof (PGP) */}
          <div className="col-span-1 flex flex-col rounded-xl border border-border bg-card p-4 shadow-lg transition-all hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Cryptographic Proof</span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
            </div>
            <div className="flex items-center gap-2 mb-3">
               <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[9px] font-bold text-primary border border-primary/20">RSA 4096-bit</span>
               <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[9px] font-bold text-foreground">Key ID: 0xF9B24A32</span>
            </div>
            <div className="space-y-3 flex-1 flex flex-col justify-end">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Alias A PGP</span>
                <p className="font-mono text-[10px] sm:text-xs text-foreground bg-background p-2 rounded border border-border truncate mt-1">{currentCandidate.aliasA.pgp}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Alias B PGP</span>
                <p className="font-mono text-[10px] sm:text-xs text-[#10b981] bg-[#10b981]/10 p-2 rounded border border-[#10b981]/30 truncate mt-1">{currentCandidate.aliasB.pgp}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Comms Identifiers */}
          <div className="col-span-1 flex flex-col rounded-xl border border-border bg-card p-4 shadow-lg transition-all hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Comms Identifiers</span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <div className="flex items-center justify-between bg-[#10b981]/10 border border-[#10b981]/30 rounded p-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Tox ID</span>
                <span className="font-mono text-xs font-bold text-[#10b981]">593A1B2C...</span>
              </div>
              <div className="flex items-center justify-between bg-background border border-border rounded p-2 opacity-50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Session ID</span>
                <span className="font-mono text-[10px] text-muted-foreground">None</span>
              </div>
              <div className="flex items-center justify-between bg-background border border-border rounded p-2 opacity-50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Jabber/XMPP</span>
                <span className="font-mono text-[10px] text-muted-foreground">None</span>
              </div>
            </div>
          </div>

          {/* Card 5: Financial Flow (Mini-Graph) */}
          <div className="col-span-1 row-span-2 rounded-xl border border-border bg-card p-4 flex flex-col shadow-lg transition-all hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bitcoin className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Financial Flow</span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
            </div>
            <p className="mb-3 text-[10px] font-medium text-muted-foreground leading-relaxed">
              Crypto streams from both aliases converge into wallet <span className="font-mono text-primary">bc1q9h...x4k2</span> with combined deposits of <span className="text-[#10b981] font-bold">$48,200</span>.
            </p>
            <div className="relative flex-1 rounded border border-border bg-background overflow-hidden min-h-[250px]">
              <ReactFlow 
                nodes={miniGraphNodes} 
                edges={miniGraphEdges} 
                fitView 
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                zoomOnScroll={false}
                panOnDrag={false}
              >
                <Background color="#1e293b" gap={16} size={1} />
              </ReactFlow>
            </div>
          </div>

          {/* Card 3: Stylometric NLP */}
          <div className="col-span-1 rounded-xl border border-border bg-card p-4 shadow-lg transition-all hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Stylometric NLP Diff</span>
              </div>
              <span className="text-[10px] font-black text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">{currentCandidate.nlpScore}</span>
            </div>
            <div className="flex flex-col gap-3 flex-1 justify-center">
              <div className="rounded border border-border bg-background p-3">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Alias A Description</span>
                <div className="text-[11px] leading-relaxed text-muted-foreground">
                  {currentCandidate.aliasA.description}
                </div>
              </div>
              <div className="rounded border border-border bg-background p-3">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Alias B Description</span>
                <div className="text-[11px] leading-relaxed text-muted-foreground">
                  {currentCandidate.aliasB.description}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Visual Computer Vision */}
          <div className="col-span-1 rounded-xl border border-border bg-card p-4 shadow-lg transition-all hover:border-slate-600">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Visual Computer Vision</span>
              </div>
              <span className="text-[10px] font-black text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">{currentCandidate.visionScore}</span>
            </div>
            <p className="mb-3 text-[10px] font-medium text-muted-foreground leading-relaxed">
              Detected identical digital scale and background grain.
            </p>
            <div className="flex gap-3 h-32 mt-auto">
              {/* Mock Image A */}
              <div className="relative flex-1 overflow-hidden rounded border border-border bg-background">
                <div className="absolute inset-0 flex items-center justify-center text-[#1e293b]">
                   <ImageIcon className="h-8 w-8 opacity-50" />
                </div>
                {/* AI Bounding Box */}
                <div className="absolute left-2 top-2 h-14 w-14 border border-primary bg-primary/10 shadow-[0_0_10px_rgba(0,255,255,0.2)]" />
                <span className="absolute bottom-1 right-1 text-[8px] font-bold tracking-wider uppercase text-muted-foreground bg-card/90 px-1.5 py-0.5 rounded border border-border">Listing A</span>
              </div>
              {/* Mock Image B */}
              <div className="relative flex-1 overflow-hidden rounded border border-border bg-background">
                 <div className="absolute inset-0 flex items-center justify-center text-[#1e293b]">
                   <ImageIcon className="h-8 w-8 opacity-50" />
                </div>
                {/* AI Bounding Box Match */}
                <div className="absolute left-6 top-4 h-14 w-14 border border-primary bg-primary/10 shadow-[0_0_10px_rgba(0,255,255,0.2)]" />
                <span className="absolute bottom-1 right-1 text-[8px] font-bold tracking-wider uppercase text-muted-foreground bg-card/90 px-1.5 py-0.5 rounded border border-border">Listing B</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
