"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

import type { Section } from "../types";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange: (next: string) => void;
  columnOrder: string[];
  columns: Record<string, Section>;
  selectedColumn: string | null;
  onColumnChange: (next: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditItemDialog({
  open,
  onOpenChange,
  text,
  onTextChange,
  columnOrder,
  columns,
  selectedColumn,
  onColumnChange,
  onSubmit,
}: EditItemDialogProps) {
  const fallbackColumn = columnOrder[0] ?? null;
  const currentColumn =
    selectedColumn && columns[selectedColumn] ? selectedColumn : fallbackColumn;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Ändra vara</DialogTitle>
            <DialogDescription>Ändra varans namn här.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="edit-text">Text</Label>
              <Input
                id="edit-text"
                name="text"
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-3">
              <Label>Kategori</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="justify-between">
                    <span className="truncate">
                      {currentColumn ? columns[currentColumn]?.title : "Ovrigt"}
                    </span>
                    <span className="ml-2 shrink-0">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                  {columnOrder.map((colId) => (
                    <DropdownMenuItem
                      key={colId}
                      onClick={() => onColumnChange(colId)}
                      className="touch-manipulation py-3"
                    >
                      {columns[colId].title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Avbryt
              </Button>
            </DialogClose>
            <Button type="submit">Spara ändring</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
