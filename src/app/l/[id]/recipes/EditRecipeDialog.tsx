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

interface EditRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onTitleChange: (nextTitle: string) => void;
  url: string;
  onUrlChange: (nextUrl: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditRecipeDialog({
  open,
  onOpenChange,
  title,
  onTitleChange,
  url,
  onUrlChange,
  onSubmit,
}: EditRecipeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Ändra receptet</DialogTitle>
            <DialogDescription>Ändra receptets titel eller url</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                name="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                name="url"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
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
