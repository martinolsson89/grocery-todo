"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { useSupabaseBoard } from "./hooks/useSupabaseBoard";
import { ListStats } from "./components/ListStats";
import { SectionColumn } from "./components/SectionColumn";
import { DuplicateItemDialog } from "./components/DuplicateItemDialog";
import { EditItemDialog } from "./components/EditItemDialog";
import { FlatListCard } from "./components/FlatListCard";
import { ListToolbar } from "./components/ListToolbar";
import { AddItemFormCard } from "./components/AddItemFormCard";
import { BoardState, coerceStoreKey } from "./types";
import { findContainer, newItemId } from "./utils";

export default function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = use(params);
  const searchParams = useSearchParams();
  const store = useMemo(() => coerceStoreKey(searchParams.get("store")), [searchParams]);

  const addFormStorageKey = useMemo(
    () => `grocery-todo:list:${listId}:add-form-open`,
    [listId]
  );

  const viewModeStorageKey = useMemo(
    () => `grocery-todo:list:${listId}:view-mode`,
    [listId]
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const { board, setBoard, isLoading, error, resetBoard } = useSupabaseBoard(listId, store);
  const [newText, setNewText] = useState("");
  const [targetColumn, setTargetColumn] = useState("frukt_gront");
  const [copied, setCopied] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateExistingId, setDuplicateExistingId] = useState<string | null>(null);
  const [duplicateProposedText, setDuplicateProposedText] = useState("");

  const [viewMode, setViewMode] = useState<"sections" | "flat">(() => {
    if (typeof window === "undefined") return "sections";
    const raw = window.localStorage.getItem(viewModeStorageKey);
    return raw === "flat" || raw === "sections" ? raw : "sections";
  });


  const [addFormOpen, setAddFormOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const raw = window.localStorage.getItem(addFormStorageKey);
    if (raw === null) return true;
    return raw === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(addFormStorageKey, addFormOpen ? "1" : "0");
  }, [addFormStorageKey, addFormOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(viewModeStorageKey, viewMode);
  }, [viewModeStorageKey, viewMode]);

  const [checkFilter, setCheckFilter] = useState<"all" | "checked" | "unchecked">("all");

  const effectiveTargetColumn = useMemo(() => {
    if (board.columns[targetColumn]) return targetColumn;
    return board.columnOrder[0] ?? targetColumn;
  }, [board.columns, board.columnOrder, targetColumn]);

  const normalizeItemText = (s: string) => s.trim().toLocaleLowerCase("sv-SE");

  const activeItem = activeItemId ? board.items[activeItemId] : null;

  async function cleanBoard() {
    const confirmed = window.confirm("Är du säker på att du vill rensa listan?");
    if (!confirmed) return;

    try {
      await Promise.resolve(resetBoard());
    } catch (e) {
      console.error("Failed to reset board", e);
    }
  }

  const columnsInOrder = useMemo(
    () => board.columnOrder.map((id) => board.columns[id]),
    [board]
  );

  const flatItemIds = useMemo(() => {
    return columnsInOrder.flatMap((col) => col.itemIds);
  }, [columnsInOrder]);

  // filtered IDs/items for flat view (SortableContext must use these)
  const visibleFlatItemIds = useMemo(() => {
    if (checkFilter === "all") return flatItemIds;

    const wantChecked = checkFilter === "checked";
    return flatItemIds.filter((id) => board.items[id]?.checked === wantChecked);
  }, [checkFilter, flatItemIds, board.items]);

  const visibleFlatItems = useMemo(() => {
    return visibleFlatItemIds.map((id) => board.items[id]).filter(Boolean);
  }, [visibleFlatItemIds, board.items]);

  function addItem(opts?: { allowDuplicate?: boolean }) {
    const allowDuplicate = opts?.allowDuplicate ?? false;

    const text = newText.trim();
    if (!text) return;

    if (!allowDuplicate) {
      const normalized = normalizeItemText(text);
      const existing = Object.values(board.items).find(
        (item) => normalizeItemText(item.text) === normalized
      );

      if (existing) {
        setDuplicateExistingId(existing.id);
        setDuplicateProposedText(text);
        setDuplicateOpen(true);
        return;
      }
    }

    const id = newItemId();
    setBoard((prev) => {
      const next: BoardState = structuredClone(prev);
      next.items[id] = { id, text, checked: false };

      const colId = next.columns[effectiveTargetColumn]
        ? effectiveTargetColumn
        : next.columnOrder[0];
      if (!colId) return prev;

      next.columns[colId].itemIds.unshift(id);
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

  function openEdit(id: string) {
    const current = board.items[id];
    if (!current) return;

    setEditId(id);
    setEditText(current.text);
    setEditOpen(true);
  }

  function openEditWithText(id: string, nextText: string) {
    const current = board.items[id];
    if (!current) return;

    setEditId(id);
    setEditText(nextText);
    setEditOpen(true);
  }

  function handleDuplicateOpenChange(open: boolean) {
    setDuplicateOpen(open);
    if (!open) {
      setDuplicateExistingId(null);
      setDuplicateProposedText("");
      setNewText("");
    }
  }

  function handleEditOpenChange(open: boolean) {
    setEditOpen(open);
    if (!open) {
      setEditId(null);
      setEditText("");
    }
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();

    const id = editId;
    if (!id) return;

    const nextText = editText.trim();
    if (!nextText) return;

    setBoard((prev) => {
      // item might have been deleted while dialog was open
      if (!prev.items[id]) return prev;

      const next: BoardState = structuredClone(prev);
      next.items[id].text = nextText;
      return next;
    });

    handleEditOpenChange(false);
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

  if (isLoading) {
    return (
      <main className="min-h-screen p-3 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar listan...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-3 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Ett fel uppstod</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-3 sm:p-4 space-y-3 max-w-full">
      {/* Duplicate Dialog */}
      <DuplicateItemDialog
        open={duplicateOpen}
        onOpenChange={handleDuplicateOpenChange}
        onEditExisting={() => {
          const id = duplicateExistingId;
          const proposed = duplicateProposedText.trim();
          handleDuplicateOpenChange(false);
          if (!id || !proposed) return;
          openEditWithText(id, proposed);
        }}
        onAddDuplicate={() => {
          addItem({ allowDuplicate: true });
          handleDuplicateOpenChange(false);
        }}
      />

      {/* Edit Dialog (rendered once at page level) */}
      <EditItemDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        text={editText}
        onTextChange={setEditText}
        onSubmit={saveEdit}
      />

      <ListToolbar
        listId={listId}
        stats={<ListStats board={board} />}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        addFormOpen={addFormOpen}
        onToggleAddForm={() => setAddFormOpen((v) => !v)}
        copied={copied}
        onCopyLink={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        } }
        onClear={cleanBoard}
        checkFilter={checkFilter}
        onCheckFilterChange={setCheckFilter} 
      >
        <AddItemFormCard
          open={addFormOpen}
          newText={newText}
          onNewTextChange={setNewText}
          targetColumn={effectiveTargetColumn}
          onTargetColumnChange={setTargetColumn}
          columnOrder={board.columnOrder}
          columns={board.columns}
          onAddItem={() => addItem()}
        />
      </ListToolbar>

      {/* Vertical Scrolling Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        {viewMode === "sections" ? (
          <div className="space-y-3 sm:space-y-4 pb-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {columnsInOrder.map((section) => {
                const visibleItemIds =
                  checkFilter === "all"
                    ? section.itemIds
                    : section.itemIds.filter((id) => {
                        const wantChecked = checkFilter === "checked";
                        return board.items[id]?.checked === wantChecked;
                      });

                const items = visibleItemIds.map((id) => board.items[id]).filter(Boolean);
                const hasItems = items.length > 0;

                return (
                  <SectionColumn
                    key={section.id}
                    sectionId={section.id}
                    title={section.title}
                    itemIds={visibleItemIds}
                    items={items}
                    hasItems={hasItems}
                    onToggle={toggleItem}
                    onEdit={openEdit}
                    onDelete={deleteItem}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <FlatListCard
            itemIds={visibleFlatItemIds}
            items={visibleFlatItems}
            onToggle={toggleItem}
            onEdit={openEdit}
            onDelete={deleteItem}
          />
        )}

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
