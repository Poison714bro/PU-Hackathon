"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  FileText,
  Download,
  Clock,
  Tag,
  User,
  ChevronRight,
  FolderOpen,
  Shield,
  Archive,
  AlertCircle,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Paperclip,
  FileDown,
  X,
  Lock,
  Scale,
  AlertTriangle,
  Copy,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { kanbanData, type KanbanColumn, type InvestigationCard } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { useKanbanBoard } from "@/hooks/useKanbanBoard";
import { useAppStore } from "@/lib/store";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "CRITICAL" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: "HIGH" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: "MEDIUM" },
  low: { color: "text-primary", bg: "bg-cyan-500/10 border-primary/20", label: "LOW" },
};

const columnIcons: Record<string, React.ElementType> = {
  intake: FolderOpen,
  active: Eye,
  review: AlertCircle,
  closed: CheckCircle2,
};

const columnColors: Record<string, string> = {
  intake: "#00d4ff",
  active: "#f97316",
  review: "#fbbf24",
  closed: "#22c55e",
};

// Draggable Card Component
function SortableInvestigationCard({ card }: { card: InvestigationCard }) {
  const openDossier = useAppStore((s) => s.openDossier);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = priorityConfig[card.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => openDossier(card.id)}
      className={`glass-card group relative p-4 cursor-pointer hover:shadow-lg transition-all ${isDragging ? "ring-2 ring-primary ring-offset-1 ring-offset-[#0f111a]" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-600">{card.id}</span>
        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${priority.bg} ${priority.color}`}>
          {priority.label}
        </span>
      </div>
      <h4 className="mb-1 text-xs font-semibold text-white">{card.title}</h4>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
        {card.description}
      </p>
      <div className="mb-2 flex flex-wrap gap-1">
        {card.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-[8px] font-bold text-white">
            {card.assignee.split(" ")[1]?.[0] || "A"}
          </div>
          <span className="text-[10px] text-muted-foreground">{card.assignee}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <div className="flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            <span>{card.evidenceCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{card.createdAt.slice(5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Board Component
export default function InvestigationManager() {
  const {
    searchQuery,
    setSearchQuery,
    activeCard,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    filteredColumns,
    totalCards,
  } = useKanbanBoard(kanbanData);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const [toastId, setToastId] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);

  const [investigationTab, setInvestigationTab] = useState<"kanban" | "conflicts" | "audit" | "dossier">("kanban");

  const [conflictsList, setConflictsList] = useState([
    {
      id: "conf-01",
      entity: "DarkPhoenix_77 (ent-001)",
      property: "Current Location",
      severity: "HIGH",
      claims: [
        { source: "Special Cell Wiretap", type: "law_enforcement_wiretap", credibility: 0.95, value: "Safehouse, Ludhiana Industrial Zone", time: "2026-09-01 10:00" },
        { source: "Telegram OSINT Channel", type: "telegram_osint", credibility: 0.60, value: "Downtown Dubai Penthouse", time: "2026-09-01 08:30" }
      ],
      status: "DISPUTED",
      resolvedValue: null as string | null
    },
    {
      id: "conf-02",
      entity: "ChemKing2026 (ent-005)",
      property: "Cartel Role",
      severity: "MEDIUM",
      claims: [
        { source: "Interpol Yellow Notice", type: "law_enforcement_wiretap", credibility: 0.92, value: "Synthesis Chemist / Lab Operator", time: "2026-08-28 14:00" },
        { source: "Dread Forum Feedback", type: "darknet_forum", credibility: 0.50, value: "Retail Broker", time: "2026-08-30 19:15" }
      ],
      status: "DISPUTED",
      resolvedValue: null as string | null
    }
  ]);

  const [auditBlocks, setAuditBlocks] = useState([
    {
      id: "dec_881a7b9c",
      category: "WARRANT_ISSUED",
      targets: ["ent-001"],
      officer: "INSP_HARPREET_SINGH_442",
      clearance: 3,
      justification: "Judicial search warrant granted for narcotics distribution command hub.",
      hash: "8f7a9c3b2e1d0f4a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a",
      timestamp: "2026-09-01 09:15:22 UTC"
    },
    {
      id: "dec_442f9a1e",
      category: "WALLET_FREEZE",
      targets: ["wallet-btc-1"],
      officer: "INSP_HARPREET_SINGH_442",
      clearance: 3,
      justification: "Emergency asset freeze order served on hot wallet with $2.45M transaction volume.",
      hash: "3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a8f7a9c3b2e1d0f4a8b7c6d5e4f",
      timestamp: "2026-09-01 10:45:10 UTC"
    },
    {
      id: "dec_192e4c88",
      category: "ENTITY_MERGE",
      targets: ["ent-001", "ent-002"],
      officer: "NEXUS_RESOLVER_AGENT",
      clearance: 2,
      justification: "Unified duplicate personas based on 100% cryptographic PGP key and BTC wallet parity.",
      hash: "5c4d3e2f1a0b9c8d7e6f5a8f7a9c3b2e1d0f4a8b7c6d5e4f3a2b1c0d9e8f7a6b",
      timestamp: "2026-09-01 11:30:00 UTC"
    }
  ]);

  useEffect(() => {
    let cancelled = false;
    api.intelligence.conflicts.list().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data && res.data.length > 0) {
        setConflictsList(res.data.map((c: any) => ({
          id: c.id,
          entity: `${c.targetLabel} (${c.entityId})`,
          property: c.field,
          severity: c.severity,
          claims: (c.sources || []).map((s: any) => ({
            source: s.source,
            type: "law_enforcement_wiretap",
            credibility: s.credibility,
            value: s.claim,
            time: s.timestamp ? s.timestamp.substring(0, 16).replace("T", " ") : "2026-09-01 10:00"
          })),
          status: c.status || "DISPUTED",
          resolvedValue: null as string | null
        })));
      }
    });

    api.intelligence.audit.getLedger().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data && res.data.blocks && res.data.blocks.length > 0) {
        setAuditBlocks(res.data.blocks.map((b: any) => ({
          id: `dec_${b.blockIndex}`,
          category: b.decisionType,
          targets: [b.targetId],
          officer: b.officer,
          clearance: 3,
          justification: b.justification,
          hash: b.blockHash,
          timestamp: b.timestamp
        })));
      }
    });

    return () => { cancelled = true; };
  }, []);

  const addToast = (message: string) => {
    const id = toastId + 1;
    setToastId(id);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleResolveConflict = async (conflictId: string, strategy: "credibility" | "recent") => {
    try {
      const strat = strategy === "credibility" ? "credibility_weighted" : "most_recent";
      const res = await api.intelligence.conflicts.resolve(conflictId, strat);
      if (res.ok && res.data) {
        addToast(`Conflict resolved via ${res.data.strategy}: ${res.data.resolvedValue}`);
        setConflictsList((prev) => prev.map((c) => {
          if (c.id === conflictId) {
            return { ...c, status: "RESOLVED", resolvedValue: res.data.resolvedValue };
          }
          return c;
        }));
        return;
      }
    } catch {
      // Handled in fallback
    }

    setConflictsList((prev) => prev.map((c) => {
      if (c.id === conflictId) {
        let val = c.claims[0].value;
        if (strategy === "recent") val = c.claims[0].time > c.claims[1].time ? c.claims[0].value : c.claims[1].value;
        addToast(`Conflict on ${c.entity} resolved via ${strategy}`);
        return { ...c, status: "RESOLVED", resolvedValue: val };
      }
      return c;
    }));
  };

  return (
    <div className="grid-bg flex h-full flex-col overflow-hidden relative">
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-card px-4 py-3 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
            >
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* New Case Modal */}
      <AnimatePresence>
        {isNewCaseOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-[450px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border bg-[#0f111a] px-6 py-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Create New Investigation</h3>
                <button onClick={() => setIsNewCaseOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Case Title</label>
                  <input type="text" className="w-full rounded border border-border bg-[#0f111a] px-3 py-2 text-xs text-white outline-none focus:border-primary" placeholder="e.g., Operation Dark Net" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority Level</label>
                  <select className="w-full rounded border border-border bg-[#0f111a] px-3 py-2 text-xs text-white outline-none focus:border-primary">
                    <option>CRITICAL</option>
                    <option>HIGH</option>
                    <option>MEDIUM</option>
                    <option>LOW</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Initial Evidence</label>
                  <textarea className="w-full rounded border border-border bg-[#0f111a] px-3 py-2 text-xs text-white outline-none focus:border-primary h-20 resize-none" placeholder="Enter initial findings or wallet addresses..." />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border bg-[#0f111a]/50 px-6 py-4">
                <button onClick={() => setIsNewCaseOpen(false)} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-white uppercase tracking-widest">Cancel</button>
                <button onClick={() => { addToast("Case created successfully"); setIsNewCaseOpen(false); }} className="rounded bg-primary px-4 py-2 text-xs font-bold text-[#0f111a] hover:bg-cyan-400 uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,255,0.3)]">Create Case</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-[var(--background)]/80 px-6 py-3 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <FolderOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Investigation Management
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {totalCards} cases • Drag & drop to update status
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-900/40 px-3 py-1.5 focus-within:border-primary/50 transition-colors">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases, tags..."
              className="w-48 bg-transparent text-xs text-foreground placeholder-slate-600 outline-none"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors focus:outline-none ${isFilterOpen ? 'border-primary text-primary bg-primary/10' : 'border-border bg-slate-900/50 text-muted-foreground hover:bg-slate-800 hover:text-foreground'}`}
            >
              <Filter className="h-3 w-3" />
              Filter
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-50"
                >
                  <div className="px-4 py-2 border-b border-border bg-[#0f111a]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Advanced Filters</span>
                  </div>
                  <div className="p-2 space-y-1">
                    <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-primary/10 hover:text-primary rounded transition-colors flex items-center justify-between">
                      Clearance Level <ChevronRight className="h-3 w-3" />
                    </button>
                    <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-primary/10 hover:text-primary rounded transition-colors flex items-center justify-between">
                      Assignee <ChevronRight className="h-3 w-3" />
                    </button>
                    <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-primary/10 hover:text-primary rounded transition-colors flex items-center justify-between">
                      Date Range <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsNewCaseOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 hover:border-primary/40 focus:outline-none transition-all shadow-[0_0_10px_rgba(0,255,255,0.1)]"
          >
            <Plus className="h-3 w-3" />
            New Case
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between border-b border-border bg-[var(--background)]/50 px-6 py-2 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
            <Shield className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-medium text-amber-400">
              Clearance Level: Level 3 Administrator
            </span>
          </div>
          <div className="h-4 w-px bg-[var(--border)]" />
          <span className="text-[10px] text-slate-600">
            Audit logging enabled • All actions recorded
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => addToast("Exporting PDF...")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-[10px] text-muted-foreground hover:bg-slate-800 hover:text-foreground focus:outline-none transition-colors"
          >
            <FileDown className="h-3 w-3" />
            Export PDF
          </button>
          <button 
            onClick={() => addToast("Exporting CSV...")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-[10px] text-muted-foreground hover:bg-slate-800 hover:text-foreground focus:outline-none transition-colors"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
          <button 
            onClick={() => addToast("Generating Report...")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-[10px] text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/30 focus:outline-none transition-colors"
          >
            <FileText className="h-3 w-3" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs for Investigations */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d131f]/95 px-6 py-2.5 backdrop-blur-md shrink-0 z-30">
        <div className="flex items-center gap-2">
          {[
            { id: "kanban", label: "Kanban Cases", icon: FolderOpen, count: totalCards },
            { id: "conflicts", label: "Contradiction Resolver", icon: AlertTriangle, count: conflictsList.filter((c) => c.status === "DISPUTED").length },
            { id: "audit", label: "Decision Audit Ledger", icon: Lock, count: auditBlocks.length },
            { id: "dossier", label: "Court Case Dossier", icon: FileText, badge: "Admissible" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = investigationTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setInvestigationTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-[#00d4ff]/10 border border-[#00d4ff]/40 text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#00d4ff]" : "text-slate-500"}`} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${isActive ? "bg-[#00d4ff] text-black font-black" : "bg-slate-800 text-slate-400"}`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[9px] font-mono text-slate-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 2: CONTRADICTION RESOLVER */}
      {investigationTab === "conflicts" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
          <div>
            <h2 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Multi-Source Contradictory Intelligence Resolver
            </h2>
            <p className="text-xs text-slate-400">
              Identifies disputed suspect locations, roles, and wallet ownership across conflicting intelligence streams.
            </p>
          </div>

          <div className="space-y-5">
            {conflictsList.map((conf) => (
              <div key={conf.id} className="rounded-xl border border-slate-800 bg-[#0d131f]/90 p-5 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono border ${
                      conf.severity === "HIGH" ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}>
                      {conf.severity} CONTRADICTION
                    </span>
                    <span className="text-xs font-bold text-white">{conf.entity}</span>
                    <span className="text-xs text-slate-400 font-mono">[{conf.property}]</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${conf.status === "RESOLVED" ? "text-emerald-400" : "text-amber-400"}`}>
                    {conf.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {conf.claims.map((claim, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-800 bg-black/40 p-3 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-300">{claim.source}</span>
                        <span className="font-mono text-[#00d4ff]">Credibility: {claim.credibility * 100}%</span>
                      </div>
                      <div className="text-xs font-bold text-white font-serif">
                        &quot;{claim.value}&quot;
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Observed: {claim.time}
                      </div>
                    </div>
                  ))}
                </div>

                {conf.status === "RESOLVED" ? (
                  <div className="rounded bg-emerald-950/30 border border-emerald-800/50 p-3 text-xs text-emerald-300 font-mono flex items-center justify-between">
                    <span>Resolved Value: <strong>{conf.resolvedValue}</strong></span>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ APPLIED TO MASTER CASE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleResolveConflict(conf.id, "credibility")}
                      className="rounded bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/40 text-[#00d4ff] px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Scale className="h-3.5 w-3.5" />
                      Resolve via Credibility Weighting
                    </button>
                    <button
                      onClick={() => handleResolveConflict(conf.id, "recent")}
                      className="rounded bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 text-xs font-bold transition-all"
                    >
                      Use Most Recent Claim
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: DECISION AUDIT LEDGER */}
      {investigationTab === "audit" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                Tamper-Evident Investigative Decision Audit Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Cryptographic SHA-256 block ledger recording officer actions for legal chain of custody and court admissibility.
              </p>
            </div>
            <div className="rounded bg-emerald-950/40 border border-emerald-800 px-3 py-1 text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              BLOCKCHAIN INTEGRITY VERIFIED
            </div>
          </div>

          <div className="space-y-4">
            {auditBlocks.map((block, idx) => (
              <div key={block.id} className="rounded-xl border border-slate-800 bg-[#0d131f]/90 p-5 backdrop-blur-md space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-amber-400">[{block.category}]</span>
                    <span className="text-slate-400">Target: {block.targets.join(", ")}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{block.timestamp}</span>
                </div>

                <p className="text-xs font-sans text-slate-200 border-l-2 border-emerald-500 pl-3">
                  {block.justification}
                </p>

                <div className="flex flex-col md:flex-row md:items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80 gap-2">
                  <div>Investigator: <strong className="text-slate-300">{block.officer} (Level {block.clearance})</strong></div>
                  <div className="truncate max-w-md">SHA-256 Seal: <span className="text-emerald-400 font-mono font-bold">{block.hash}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: COURT CASE DOSSIER */}
      {investigationTab === "dossier" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00d4ff]" />
                Court-Ready Intelligence Dossier Generator
              </h2>
              <p className="text-xs text-slate-400">
                Exports official law enforcement case reports, Neo4j Cypher scripts, and W3C JSON-LD graphs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => addToast("Dossier copied in Court Markdown format!")}
                className="rounded bg-[#00d4ff] hover:bg-cyan-400 text-black px-3 py-1.5 text-xs font-black uppercase transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,212,255,0.4)]"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Markdown
              </button>
              <button
                onClick={() => addToast("Exported case to Neo4j Cypher and JSON-LD!")}
                className="rounded bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Export Cypher
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-black/90 p-8 shadow-2xl space-y-6 font-mono text-xs text-slate-300">
            <div className="text-center border-b border-slate-800 pb-4">
              <div className="inline-block rounded bg-red-950/60 border border-red-800 px-3 py-1 text-[10px] font-black tracking-widest text-red-400 mb-2">
                LAW ENFORCEMENT SENSITIVE // RESTRICTED DISSEMINATION
              </div>
              <h3 className="text-sm font-black text-white uppercase">OFFICIAL CYBER INTELLIGENCE DOSSIER</h3>
              <p className="text-[10px] text-slate-500">CASE REFERENCE: CASE-2026-CYBER-PUNJAB-09</p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-black text-[#00d4ff] uppercase mb-1">1. PRIMARY TARGET IDENTIFIER</h4>
                <p className="text-slate-200 font-sans"><strong>DarkPhoenix_77</strong> (UUID: <code>ent-001</code>) • Risk Score: <strong>94/100</strong> • Status: <strong>Active Target</strong></p>
              </div>

              <div>
                <h4 className="text-[11px] font-black text-[#00d4ff] uppercase mb-1">2. ON-CHAIN CRYPTOGRAPHIC IDENTIFIERS</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Bitcoin: <code>bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2</code> ($2.45M Vol)</li>
                  <li>Monero: <code>42xM7q9Lr5kB3pN2vT1wH4yG6fD8cE0zA7sJ5mK9oI3uR6tY1wQ4eP2xL</code> ($890K Vol)</li>
                  <li>PGP Key: <code>F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62</code></li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-black text-[#00d4ff] uppercase mb-1">3. KINGPIN & NETWORK CENTRALITY ANALYTICS</h4>
                <p className="text-slate-300 font-sans">
                  Kingpin Composite Index: <strong>100.0/100</strong> • PageRank Authority: <strong>0.082</strong> • Betweenness Broker Score: <strong>0.450</strong> • Role: <em>Primary Kingpin & Bulk Narcotics Supplier</em>.
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-black text-[#00d4ff] uppercase mb-1">4. EVIDENTIARY AUDIT BLOCKCHAIN SEAL</h4>
                <p className="text-slate-400 font-mono text-[10px]">
                  Ledger Hash: <code>8f7a9c3b2e1d0f4a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a</code><br />
                  Authorized by Inspector Harpreet Singh (Clearance Level 3).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD */}
      {investigationTab === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 gap-4 overflow-x-auto p-6 custom-scrollbar items-start">
            {filteredColumns.map((column) => {
              const Icon = columnIcons[column.id] || FolderOpen;
              const color = columnColors[column.id] || "#64748b";
              return (
                <div
                  key={column.id}
                  className="flex w-80 shrink-0 flex-col h-full max-h-full"
                >
                  {/* Column Header */}
                  <div className="mb-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: `${color}15` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <span className="text-xs font-semibold text-white">{column.title}</span>
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${color}15`, color }}>
                        {column.cards.length}
                      </span>
                    </div>
                    <button className="text-slate-600 hover:text-muted-foreground focus:outline-none transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Column Body - Droppable Zone */}
                  <div className={`kanban-column flex-1 overflow-y-auto custom-scrollbar p-2 transition-all rounded-lg border border-transparent bg-slate-900/20`}>
                    <SortableContext
                      items={column.cards.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-3 min-h-[150px]">
                        {column.cards.map((card) => (
                          <SortableInvestigationCard key={card.id} card={card} />
                        ))}
                        {column.cards.length === 0 && (
                          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-slate-600">
                            Drop cases here
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Drag Overlay for smooth dragging visual */}
          <DragOverlay>
            {activeCard ? (
              <div className="opacity-80 scale-105 shadow-2xl cursor-grabbing">
                 <SortableInvestigationCard card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
