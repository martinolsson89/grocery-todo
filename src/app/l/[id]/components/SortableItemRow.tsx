"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { Item } from "../types";

interface SortableItemRowProps {
  item: Item;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SortableItemRow({ item, onToggle, onEdit, onDelete }: SortableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const displayText = item.text.length > 20 ? `${item.text.slice(0, 20)}…` : item.text;

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

      <span
        className={["flex-1", item.checked ? "line-through text-muted-foreground" : ""].join(" ")}
        title={item.text}
      >
        {displayText}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Ändra"
          title="Ändra"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(item.id);
          }}
        >
          <PencilIcon />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Radera"
          title="Radera"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <Trash2Icon />
        </Button>
      </div>

    </div>
  );
}
