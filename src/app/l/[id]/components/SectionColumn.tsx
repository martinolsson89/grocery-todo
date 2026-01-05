"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import type { Item } from "../types";
import { SortableItemRow } from "./SortableItemRow";

interface SectionColumnProps {
  sectionId: string;
  title: string;
  itemIds: string[];
  items: Item[];
  hasItems: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SectionColumn({
  sectionId,
  title,
  itemIds,
  items,
  hasItems,
  onToggle,
  onEdit,
  onDelete,
}: SectionColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: sectionId });

  const toggledCount = useMemo(
    () => items.reduce((acc, item) => acc + (item.checked ? 1 : 0), 0),
    [items]
  );

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
              {toggledCount}/{items.length} avbockade
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
              onEdit={onEdit}
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
