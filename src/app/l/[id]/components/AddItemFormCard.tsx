"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";

import type { Section } from "../types";

interface AddItemFormCardProps {
  open: boolean;

  newText: string;
  onNewTextChange: (next: string) => void;

  targetColumn: string;
  onTargetColumnChange: (next: string) => void;

  columnOrder: string[];
  columns: Record<string, Section>;

  onAddItem: () => void;
}

export function AddItemFormCard({
  open,
  newText,
  onNewTextChange,
  targetColumn,
  onTargetColumnChange,
  columnOrder,
  columns,
  onAddItem,
}: AddItemFormCardProps) {
  if (!open) return null;

  return (
    <Card id="add-item-form" className="mt-3">
      <CardContent className="p-3 sm:p-4 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Lägg till vara..."
            value={newText}
            onChange={(e) => onNewTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              e.stopPropagation();
              onAddItem();
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
                <span className="truncate">{columns[targetColumn]?.title ?? "Övrigt"}</span>
                <span className="ml-2 shrink-0">▼</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
              {columnOrder.map((colId) => (
                <DropdownMenuItem
                  key={colId}
                  onClick={() => onTargetColumnChange(colId)}
                  className="touch-manipulation py-3"
                >
                  {columns[colId].title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onAddItem} className="flex-1 sm:flex-none touch-manipulation h-11">
            Lägg till
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
