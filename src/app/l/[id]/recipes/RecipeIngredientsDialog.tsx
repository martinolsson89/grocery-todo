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

type RecipeIngredientsDialogStatus = "loading" | "success" | "error";

interface RecipeIngredientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: RecipeIngredientsDialogStatus;
  ingredients: string[];
  error: string | null;
  sourceUrl: string;
  title: string | null;
}

export function RecipeIngredientsDialog({
  open,
  onOpenChange,
  status,
  ingredients,
  error,
  sourceUrl,
  title,
}: RecipeIngredientsDialogProps) {
  const description = title ? `${title} · ${sourceUrl}` : sourceUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Ingredienser</DialogTitle>
          <DialogDescription className="wrap-break-words">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {status === "loading" ? (
            <p className="text-sm text-muted-foreground">Hämtar ingredienser…</p>
          ) : null}

          {status === "error" ? (
            <p className="text-sm text-destructive">
              {error ?? "Kunde inte hämta ingredienser."}
            </p>
          ) : null}

          {status === "success" ? (
            ingredients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga ingredienser hittades.</p>
            ) : (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {ingredients.map((ingredient, idx) => (
                  <li key={`${idx}-${ingredient}`} className="wrap-break-words">
                    {ingredient}
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Stäng
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
