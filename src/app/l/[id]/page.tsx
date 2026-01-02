"use client";

import { use, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Button } from "@/src/app/components/ui/button";
import { Card, CardContent } from "@/src/app/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/app/components/ui/dropdown-menu";
import { Input } from "@/src/app/components/ui/input";

import { useLocalStorageBoard } from "./hooks/useLocalStorageBoard";
import { ListStats } from "./components/ListStats";
import { SortableItemRow } from "./components/SortableItemRow";
import { BoardState, DEFAULT_BOARD, type Item } from "./types";
import { findContainer, newItemId, storageKey } from "./utils";

export default function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = use(params);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const [board, setBoard] = useLocalStorageBoard(listId);
  const [newText, setNewText] = useState("");
  const [targetColumn, setTargetColumn] = useState("ovrigt");
  const [copied, setCopied] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const activeItem = activeItemId ? board.items[activeItemId] : null;

  const columnsInOrder = useMemo(
    () => board.columnOrder.map((id) => board.columns[id]),
    [board]
  );

  function addItem() {
    const text = newText.trim();
    if (!text) return;

    const id = newItemId();
    setBoard((prev) => {
      const next: BoardState = structuredClone(prev);
      next.items[id] = { id, text, checked: false };
      next.columns[targetColumn].itemIds.unshift(id);
      return next;
    });

    setNewText("");
  }

  function toggleItem(id: string) {
    setBoard((prev) => {
      const next: BoardState = structuredClone(prev);
      next.items[id].checked = !next.items[id].checked;
      return next;
    });
  }

  function deleteItem(id: string) {
    setBoard((prev) => {
      const next: BoardState = structuredClone(prev);

      // remove from items
      delete next.items[id];

      // remove from whichever column it’s in
      const containerId = findContainer(next, id);
      if (containerId) {
        next.columns[containerId].itemIds = next.columns[containerId].itemIds.filter(
          (x) => x !== id
        );
      }

      return next;
    });
  }

  function onDragStart(event: DragStartEvent) {
    setActiveItemId(String(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    setBoard((prev) => {
      const activeContainer = findContainer(prev, activeId);
      // Check if overId is a section or an item
      const overIsSection = prev.columns[overId] !== undefined;
      const overContainer = overIsSection ? overId : findContainer(prev, overId);

      if (!activeContainer || !overContainer) return prev;
      if (activeContainer === overContainer) return prev;

      const next: BoardState = structuredClone(prev);

      // remove from old column
      next.columns[activeContainer].itemIds = next.columns[activeContainer].itemIds.filter(
        (x) => x !== activeId
      );

      // insert into new column
      const overItems = next.columns[overContainer].itemIds;
      const overIndex = overIsSection ? overItems.length : overItems.indexOf(overId);

      const insertIndex = overIndex >= 0 ? overIndex : overItems.length;

      next.columns[overContainer].itemIds.splice(insertIndex, 0, activeId);

      return next;
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    setActiveItemId(null);

    if (!overId) return;

    setBoard((prev) => {
      const container = findContainer(prev, activeId);
      const overIsSection = prev.columns[overId] !== undefined;
      const overContainer = overIsSection ? overId : findContainer(prev, overId);
      if (!container || !overContainer) return prev;

      // only reorder when dropping within same container
      if (container !== overContainer) return prev;

      const oldIndex = prev.columns[container].itemIds.indexOf(activeId);
      const newIndex = prev.columns[container].itemIds.indexOf(overId);

      if (oldIndex === -1 || newIndex === -1) return prev;
      if (oldIndex === newIndex) return prev;

      const next: BoardState = structuredClone(prev);
      next.columns[container].itemIds = arrayMove(
        next.columns[container].itemIds,
        oldIndex,
        newIndex
      );

      return next;
    });
  }

  return (
    <main className="min-h-screen p-3 sm:p-4 space-y-3 max-w-full">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pb-3">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold truncate">Inköpslista ({listId})</h1>
              <ListStats board={board} />
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="touch-manipulation"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? "✓" : "📋"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="touch-manipulation"
                onClick={() => {
                  localStorage.removeItem(storageKey(listId));
                  setBoard(DEFAULT_BOARD);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Add Item Form */}
        <Card className="mt-3">
          <CardContent className="p-3 sm:p-4 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Lägg till vara..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addItem();
                }}
                className="flex-1 h-11 touch-manipulation text-base"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none sm:min-w-40 justify-between touch-manipulation h-11"
                  >
                    <span className="truncate">{board.columns[targetColumn]?.title ?? "Övrigt"}</span>
                    <span className="ml-2 shrink-0">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                  {board.columnOrder.map((colId) => (
                    <DropdownMenuItem
                      key={colId}
                      onClick={() => setTargetColumn(colId)}
                      className="touch-manipulation py-3"
                    >
                      {board.columns[colId].title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={addItem} className="flex-1 sm:flex-none touch-manipulation h-11">
                Lägg till
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vertical Scrolling Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="space-y-3 sm:space-y-4 pb-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {columnsInOrder.map((section) => {
              const items = section.itemIds.map((id) => board.items[id]).filter(Boolean);
              const hasItems = items.length > 0;

              return (
                <SectionColumn
                  key={section.id}
                  sectionId={section.id}
                  title={section.title}
                  itemIds={section.itemIds}
                  items={items}
                  hasItems={hasItems}
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={null} style={{ position: "fixed" }}>
          {activeItem ? (
            <div className="rounded-md border bg-background px-4 py-3 shadow-lg text-base pointer-events-none w-max max-w-70">
              {activeItem.text}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

// Section Column Component
interface SectionColumnProps {
  sectionId: string;
  title: string;
  itemIds: string[];
  items: Item[];
  hasItems: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function SectionColumn({
  sectionId,
  title,
  itemIds,
  items,
  hasItems,
  onToggle,
  onDelete,
}: SectionColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: sectionId });

  return (
    <div
      className={[
        "w-full rounded-lg border bg-card",
        isOver ? "ring-2 ring-primary" : "",
      ].join(" ")}
    >
      {/* Section Header */}
      <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 border-b rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{title}</h3>
          {hasItems && (
            <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Section Items */}
      <div ref={setNodeRef} className="p-2 space-y-1.5 min-h-25">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {!hasItems && (
          <div className="rounded-md border border-dashed p-4 text-xs text-center text-muted-foreground">
            Dra varor hit
          </div>
        )}
      </div>
    </div>
  );
}
