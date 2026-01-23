"use client";

import type { ComponentProps } from "react";
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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: ComponentProps<typeof Button>["variant"];
  copied?: boolean;
  onCopyLink?: () => void;
  hasCopiedLink?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  onCopyLink,
  hasCopiedLink
}: ConfirmDialogProps) {
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          {!onCopyLink ? (
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Avbryt
            </Button>
          </DialogClose>
         ) : null }
          {onCopyLink ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCopyLink}
              aria-label="Kopiera länk"
            >
              {hasCopiedLink ? "✓" : "Kopiera länk"}
            </Button>
          ) : null}
          <Button type="button" variant={hasCopiedLink ? "success" : "destructive"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
