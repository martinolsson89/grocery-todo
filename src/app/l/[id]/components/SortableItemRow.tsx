"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/src/components/ui/button";
import type { Item } from "../types";

interface SortableItemRowProps {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SortableItemRow({ item, onToggle, onDelete }: SortableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center gap-2 rounded-md border bg-background px-2 py-2",
        isDragging ? "opacity-60" : "",
      ].join(" ")}
    >
      {/* drag handle */}
      <button
        className="cursor-grab select-none px-3 py-1 text-muted-foreground text-lg touch-manipulation"
        {...attributes}
        {...listeners}
        aria-label="Drag item"
        title="Drag"
      >
        ≡
      </button>

      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id)}
        className="h-5 w-5 touch-manipulation"
      />

      <span className={["flex-1", item.checked ? "line-through text-muted-foreground" : ""].join(" ")}>
        {item.text}
      </span>

      <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
        Delete
      </Button>
    </div>
  );
}
