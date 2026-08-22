import { useState, useMemo } from "react";
import { type KanbanColumn, type InvestigationCard } from "@/lib/mockData";
import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

export function useKanbanBoard(initialData: KanbanColumn[]) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveCardId(e.active.id as string);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';
    const isOverColumn = over.data.current?.type === 'Column';
    
    if (!isActiveCard) return;
    
    setColumns(columns => {
       const activeColumnIndex = columns.findIndex(col => col.cards.some(c => c.id === activeId));
       const overColumnIndex = isOverColumn 
         ? columns.findIndex(col => col.id === overId)
         : columns.findIndex(col => col.cards.some(c => c.id === overId));
       
       if (activeColumnIndex === -1 || overColumnIndex === -1) return columns;
       
       if (activeColumnIndex !== overColumnIndex) {
         const newColumns = [...columns];
         const activeColumn = newColumns[activeColumnIndex];
         const overColumn = newColumns[overColumnIndex];
         
         const activeCardIndex = activeColumn.cards.findIndex(c => c.id === activeId);
         const activeCard = activeColumn.cards[activeCardIndex];
         
         const newActiveColumnCards = [...activeColumn.cards];
         newActiveColumnCards.splice(activeCardIndex, 1);
         newColumns[activeColumnIndex] = { ...activeColumn, cards: newActiveColumnCards };
         
         const newOverColumnCards = [...overColumn.cards];
         if (isOverCard) {
            const overCardIndex = overColumn.cards.findIndex(c => c.id === overId);
            // Put below if dropping on bottom half
            const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
            const modifier = isBelowOverItem ? 1 : 0;
            const newIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn.cards.length;
            newOverColumnCards.splice(newIndex, 0, activeCard);
         } else {
            newOverColumnCards.push(activeCard);
         }
         newColumns[overColumnIndex] = { ...overColumn, cards: newOverColumnCards };
         
         return newColumns;
       }
       
       return columns;
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCardId(null);
    const { active, over } = e;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    setColumns(columns => {
       const activeColumnIndex = columns.findIndex(col => col.cards.some(c => c.id === activeId));
       const overColumnIndex = columns.findIndex(col => col.id === overId || col.cards.some(c => c.id === overId));
       
       if (activeColumnIndex === -1 || overColumnIndex === -1) return columns;
       
       if (activeColumnIndex === overColumnIndex) {
         const column = columns[activeColumnIndex];
         const activeIndex = column.cards.findIndex(c => c.id === activeId);
         const overIndex = column.cards.findIndex(c => c.id === overId);
         
         if (activeIndex !== overIndex && overIndex !== -1) {
            const newColumns = [...columns];
            newColumns[activeColumnIndex] = {
               ...column,
               cards: arrayMove(column.cards, activeIndex, overIndex)
            };
            return newColumns;
         }
       }
       return columns;
    });
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
  
  const activeCard = useMemo(() => {
     if (!activeCardId) return null;
     for (const col of columns) {
        const found = col.cards.find(c => c.id === activeCardId);
        if (found) return found;
     }
     return null;
  }, [activeCardId, columns]);

  return {
    columns,
    searchQuery,
    setSearchQuery,
    activeCard,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    filteredColumns,
    totalCards,
  };
}
