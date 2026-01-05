"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Card, CardContent } from "@/src/components/ui/card";

import type { Item } from "../types";
import { SortableItemRow } from "./SortableItemRow";

interface FlatListCardProps {
  itemIds: string[];
  items: Item[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FlatListCard({ itemIds, items, onToggle, onEdit, onDelete }: FlatListCardProps) {
  return (
    <Card className="pb-4">
      <CardContent className="p-2 sm:p-3">
        <div className="sticky top-0 bg-card/90 backdrop-blur-sm px-2 py-2 border-b rounded-md">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Alla varor</h3>
            <span className="text-xs text-muted-foreground">{items.length} st</span>
          </div>
        </div>

        <div className="p-1 space-y-1.5">
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

          {items.length === 0 && (
            <div className="rounded-md border border-dashed p-4 text-xs text-center text-muted-foreground">
              Inga varor
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
