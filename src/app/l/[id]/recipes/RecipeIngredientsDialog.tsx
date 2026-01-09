"use client";

import { useMemo, useState } from "react";

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
  onAddSelected?: (ingredients: string[]) => void | Promise<void>;
}

export function RecipeIngredientsDialog({
  open,
  onOpenChange,
  status,
  ingredients,
  error,
  sourceUrl,
  title,
  onAddSelected,
}: RecipeIngredientsDialogProps) {
  const description = title ? `${title} · ${sourceUrl}` : sourceUrl;

  const ingredientKeys = useMemo(
    () => ingredients.map((ingredient, idx) => `${idx}-${ingredient}`),
    [ingredients]
  );

  const [uncheckedByKey, setUncheckedByKey] = useState<Record<string, true>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // Default all ingredients to checked each time dialog opens.
      setUncheckedByKey({});
    }
    onOpenChange(nextOpen);
  };

  const checkedIngredients = useMemo(() => {
    const selected: string[] = [];
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      const key = ingredientKeys[i];
      const isUnchecked = uncheckedByKey[key] ?? false;
      if (!isUnchecked) selected.push(ingredient);
    }
    return selected;
  }, [ingredientKeys, ingredients, uncheckedByKey]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <ul className="text-sm space-y-2">
                {ingredients.map((ingredient, idx) => {
                  const key = ingredientKeys[idx];
                  const checked = !(uncheckedByKey[key] ?? false);

                  return (
                    <li key={key} className="wrap-break-words">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-5 w-5"
                          checked={checked}
                          onChange={(e) => {
                            const nextChecked = e.target.checked;
                            setUncheckedByKey((prev) => {
                              if (nextChecked) {
                                if (!prev[key]) return prev;
                                const { [key]: removed, ...rest } = prev;
                                void removed;
                                return rest;
                              }

                              if (prev[key]) return prev;
                              return { ...prev, [key]: true };
                            });
                          }}
                        />
                        <span>{ingredient}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}
        </div>

        <DialogFooter>
          {status === "success" ? (
            <Button
              type="button"
              disabled={
                isSubmitting ||
                ingredients.length === 0 ||
                checkedIngredients.length === 0 ||
                !onAddSelected
              }
              onClick={async () => {
                if (!onAddSelected) return;
                setIsSubmitting(true);
                try {
                  await onAddSelected(checkedIngredients);
                  handleOpenChange(false);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              Lägg till valda
            </Button>
          ) : null}
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
