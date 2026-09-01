import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useKanbanBoard } from "./useKanbanBoard";
import { type KanbanColumn } from "@/lib/mockData";

const mockKanbanInitial: KanbanColumn[] = [
  {
    id: "intake",
    title: "Intake",
    cards: [
      {
        id: "INV-001",
        title: "AlphaBay Vendor Cluster",
        description: "Large scale synthetic distribution network",
        priority: "critical",
        assignee: "Agent Torres",
        createdAt: "2026-08-01",
        tags: ["darknet", "fentanyl"],
        evidenceCount: 12,
      },
      {
        id: "INV-002",
        title: "Telegram Bulk Channel",
        description: "Encrypted messaging channel distribution",
        priority: "high",
        assignee: "Agent Chen",
        createdAt: "2026-08-05",
        tags: ["telegram", "stimulants"],
        evidenceCount: 5,
      }
    ]
  },
  {
    id: "active",
    title: "Active Investigation",
    cards: [
      {
        id: "INV-003",
        title: "Monero Money Laundering Ring",
        description: "Cross-chain mixing investigation",
        priority: "medium",
        assignee: "Agent Miller",
        createdAt: "2026-08-10",
        tags: ["crypto", "mixer"],
        evidenceCount: 8,
      }
    ]
  },
  {
    id: "closed",
    title: "Closed",
    cards: []
  }
];

describe("useKanbanBoard Hook", () => {
  it("initializes columns and calculates total cards count", () => {
    const { result } = renderHook(() => useKanbanBoard(mockKanbanInitial));

    expect(result.current.columns).toHaveLength(3);
    expect(result.current.totalCards).toBe(3);
    expect(result.current.activeCard).toBeNull();
  });

  it("filters cards by title and tags with search query", () => {
    const { result } = renderHook(() => useKanbanBoard(mockKanbanInitial));

    act(() => {
      result.current.setSearchQuery("fentanyl");
    });

    const intakeCards = result.current.filteredColumns.find(c => c.id === "intake")?.cards;
    const activeCards = result.current.filteredColumns.find(c => c.id === "active")?.cards;

    expect(intakeCards).toHaveLength(1);
    expect(intakeCards?.[0].id).toBe("INV-001");
    expect(activeCards).toHaveLength(0);
  });

  it("sets active card on drag start", () => {
    const { result } = renderHook(() => useKanbanBoard(mockKanbanInitial));

    act(() => {
      result.current.handleDragStart({
        active: { id: "INV-001", data: { current: { type: "Card" } } }
      } as any);
    });

    expect(result.current.activeCard).toBeDefined();
    expect(result.current.activeCard?.title).toBe("AlphaBay Vendor Cluster");
  });

  it("moves card between columns on drag over", () => {
    const { result } = renderHook(() => useKanbanBoard(mockKanbanInitial));

    act(() => {
      result.current.handleDragOver({
        active: { id: "INV-001", data: { current: { type: "Card" } } },
        over: { id: "closed", data: { current: { type: "Column" } } }
      } as any);
    });

    const closedColumn = result.current.columns.find(c => c.id === "closed");
    const intakeColumn = result.current.columns.find(c => c.id === "intake");

    expect(closedColumn?.cards.some(c => c.id === "INV-001")).toBe(true);
    expect(intakeColumn?.cards.some(c => c.id === "INV-001")).toBe(false);
  });
});
