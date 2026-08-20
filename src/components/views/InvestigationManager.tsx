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
} from "lucide-react";
import { kanbanData, type KanbanColumn, type InvestigationCard } from "@/lib/mockData";

const priorityConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
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

function InvestigationCardComponent({ card, onDragStart }: { card: InvestigationCard; onDragStart: (e: React.DragEvent, cardId: string) => void }) {
  const priority = priorityConfig[card.priority];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      className="kanban-card group animate-fade-in"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-600">{card.id}</span>
        <span
          className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${priority.bg} ${priority.color}`}
        >
          {priority.label}
        </span>
      </div>
      <h4 className="mb-1 text-xs font-semibold text-white">{card.title}</h4>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
        {card.description}
      </p>
      <div className="mb-2 flex flex-wrap gap-1">
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[9px] font-medium text-muted-foreground"
          >
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
      {/* Hover actions */}
      <div className="mt-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button className="flex-1 rounded bg-cyan-500/10 py-1 text-center text-[10px] text-primary hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          View
        </button>
        <button className="flex-1 rounded bg-slate-800/50 py-1 text-center text-[10px] text-muted-foreground hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          Edit
        </button>
        <button className="rounded bg-slate-800/50 px-2 py-1 text-muted-foreground hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <MoreHorizontal className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function InvestigationManager() {
  const [columns, setColumns] = useState<KanbanColumn[]>(kanbanData);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedCard) return;

    setColumns((prev) => {
      const newColumns = prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== draggedCard),
      }));

      let movedCard: InvestigationCard | undefined;
      for (const col of prev) {
        const found = col.cards.find((c) => c.id === draggedCard);
        if (found) {
          movedCard = found;
          break;
        }
      }

      if (movedCard) {
        const targetCol = newColumns.find((c) => c.id === targetColumnId);
        if (targetCol) {
          targetCol.cards.push(movedCard);
        }
      }

      return newColumns;
    });
    setDraggedCard(null);
  };

  const filteredColumns = columns.map((col) => ({
    ...col,
    cards: col.cards.filter(
      (card) =>
        !searchQuery ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.tags.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        card.id.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  const totalCards = columns.reduce((sum, col) => sum + col.cards.length, 0);

  return (
    <div className="grid-bg flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-[var(--background)]/80 px-6 py-3 backdrop-blur-xl">
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
          <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-900/40 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases, tags..."
              className="w-48 bg-transparent text-xs text-foreground placeholder-slate-600 outline-none"
            />
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-slate-900/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
            <Filter className="h-3 w-3" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
            <Plus className="h-3 w-3" />
            New Case
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between border-b border-border bg-[var(--background)]/50 px-6 py-2">
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
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-[10px] text-muted-foreground hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
            <FileDown className="h-3 w-3" />
            Export PDF
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-[10px] text-muted-foreground hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
            <Download className="h-3 w-3" />
            Export CSV
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-[10px] text-muted-foreground hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
            <FileText className="h-3 w-3" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {filteredColumns.map((column) => {
          const Icon = columnIcons[column.id] || FolderOpen;
          const color = columnColors[column.id] || "#64748b";
          return (
            <div
              key={column.id}
              className="flex w-80 shrink-0 flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{ background: `${color}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold text-white">{column.title}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: `${color}15`,
                      color,
                    }}
                  >
                    {column.cards.length}
                  </span>
                </div>
                <button className="text-slate-600 hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Column Body */}
              <div
                className={`kanban-column flex-1 space-y-3 overflow-auto p-3 transition-all ${
                  draggedCard ? "border-dashed border-primary/30" : ""
                }`}
              >
                {column.cards.map((card) => (
                  <InvestigationCardComponent
                    key={card.id}
                    card={card}
                    onDragStart={handleDragStart}
                  />
                ))}
                {column.cards.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-slate-600">
                    Drop cases here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
