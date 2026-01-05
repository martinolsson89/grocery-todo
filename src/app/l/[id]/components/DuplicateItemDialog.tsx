"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

interface DuplicateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditExisting: () => void;
  onAddDuplicate: () => void;
}

export function DuplicateItemDialog({
  open,
  onOpenChange,
  onEditExisting,
  onAddDuplicate,
}: DuplicateItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-106.25"
        onOpenAutoFocus={(e) => {
          // Avoid the opening Enter key from auto-clicking the first focused button
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Den varan finns redan</DialogTitle>
          <DialogDescription>
            Vill du lägga till den ändå, ändra den befintliga varan, eller kasta den du försöker lägga till?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="secondary" onClick={onEditExisting}>
            Ändra befintlig
          </Button>
          <Button type="button" onClick={onAddDuplicate}>
            Lägg till ändå
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
