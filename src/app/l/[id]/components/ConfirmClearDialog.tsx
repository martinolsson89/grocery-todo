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

interface ConfirmClearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmClearDialog({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmClearDialogProps) {
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
          <DialogTitle>Rensa listan?</DialogTitle>
          <DialogDescription>Detta tar bort alla varor.</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Avbryt
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Rensa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
