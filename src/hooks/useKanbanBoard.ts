import { useState, useMemo } from "react";
import { type KanbanColumn, type InvestigationCard } from "@/lib/mockData";

export function useKanbanBoard(initialData: KanbanColumn[]) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialData);
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

  const filteredColumns = useMemo(() => {
    return columns.map((col) => ({
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
  }, [columns, searchQuery]);

  const totalCards = useMemo(() => {
    return columns.reduce((sum, col) => sum + col.cards.length, 0);
  }, [columns]);

  return {
    searchQuery,
    setSearchQuery,
    draggedCard,
    handleDragStart,
    handleDragOver,
    handleDrop,
    filteredColumns,
    totalCards,
  };
}
