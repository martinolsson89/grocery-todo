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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange: (next: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditItemDialog({
  open,
  onOpenChange,
  text,
  onTextChange,
  onSubmit,
}: EditItemDialogProps) {
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
