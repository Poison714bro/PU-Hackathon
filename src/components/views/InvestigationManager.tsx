"use client";

import { useState } from "react";
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
} from "lucide-react";
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

// ── Draggable Card Component ──
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

// ── Main Board Component ──
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

  const addToast = (message: string) => {
    const id = toastId + 1;
    setToastId(id);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
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

      {/* Kanban Board DND Context */}
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
    </div>
  );
}
