"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useSupabaseRecipes } from "../hooks/useSupabaseRecipes";
import { useSupabaseBoard } from "../hooks/useSupabaseBoard";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { EditRecipeDialog } from "./EditRecipeDialog";
import { RecipeIngredientsDialog } from "./RecipeIngredientsDialog";
import { coerceStoreKey, type BoardState } from "../types";
import { suggestColumnForIngredient } from "../ingredientCategorizer";
import { newItemId } from "../utils";

function coerceHttpsUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

type ScrapeState =
  | {
      status: "idle";
      ingredients: string[];
      title: string | null;
      sourceUrl: string;
      error: null;
      instructions: string | null;
      yields: string | null;
      total_time: number | null;
      image_url: string | null;
      host: string | null;
    }
  | {
      status: "loading";
      ingredients: string[];
      title: string | null;
      sourceUrl: string;
      error: null;
      instructions: string | null;
      yields: string | null;
      total_time: number | null;
      image_url: string | null;
      host: string | null;
    }
  | {
      status: "success";
      ingredients: string[];
      title: string | null;
      sourceUrl: string;
      error: null;
      instructions: string | null;
      yields: string | null;
      total_time: number | null;
      image_url: string | null;
      host: string | null;
    }
  | {
      status: "error";
      ingredients: string[];
      title: string | null;
      sourceUrl: string;
      error: string;
      instructions: null;
      yields: null;
      total_time: null;
      image_url: null;
      host: null;
    };

function extractIngredients(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  if (!("ingredients" in payload)) return [];
  const ingredients = (payload as { ingredients?: unknown }).ingredients;
  if (!Array.isArray(ingredients)) return [];

  const strings = ingredients
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);

  return strings;
}

function extractTitle(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const title = (payload as { title?: unknown }).title;
  if (typeof title !== "string") return null;
  const trimmed = title.trim();
  return trimmed ? trimmed : null;
}

function extractString(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function extractNonNegativeInt(payload: unknown, key: string): number | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[key];

  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(num)) return null;
  const int = Math.trunc(num);
  if (int < 0) return null;
  return int;
}

export default function RecipesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = use(params);
  const searchParams = useSearchParams();
  const storeParam = searchParams.get("store");
  const store = useMemo(() => coerceStoreKey(storeParam), [storeParam]);
  const shouldSyncStore = storeParam !== null;

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    recipes,
    isLoading: recipesLoading,
    error: recipesError,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  } = useSupabaseRecipes(listId);

  const {
    setBoard,
    isLoading: boardLoading,
    error: boardError,
  } = useSupabaseBoard(listId, store, shouldSyncStore);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [scrapeState, setScrapeState] = useState<ScrapeState>({
    status: "idle",
    ingredients: [],
    title: null,
    sourceUrl: "",
    error: null,
    instructions: null,
    yields: null,
    total_time: null,
    image_url: null,
    host: null,
  });
  const [duplicateItemsOpen, setDuplicateItemsOpen] = useState(false);
  const [duplicateItems, setDuplicateItems] = useState<string[]>([]);

  function openEditDialog(recipe: { id: string; title: string; url: string }) {
    setEditId(recipe.id);
    setEditTitle(recipe.title);
    setEditUrl(recipe.url);
    setEditOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;

    const nextTitle = editTitle.trim();
    const nextUrl = coerceHttpsUrl(editUrl);

    if (!nextTitle || !nextUrl) {
      setFormError("Titel och URL krävs.");
      return;
    }

    try {
      await updateRecipe(editId, { title: nextTitle, url: nextUrl });
      setEditOpen(false);
      setEditId(null);
      setEditTitle("");
      setEditUrl("");
    } catch {
      setFormError("Kunde inte uppdatera receptet.");
    }
  }

  function handleEditOpenChange(open: boolean) {
    setEditOpen(open);
    if (!open) {
      setEditId(null);
      setEditTitle("");
      setEditUrl("");
    }
  }

  function handleIngredientsOpenChange(open: boolean) {
    setIngredientsOpen(open);
    if (!open) {
      setScrapeState({
        status: "idle",
        ingredients: [],
        title: null,
        sourceUrl: "",
        error: null,
        instructions: null,
        yields: null,
        total_time: null,
        image_url: null,
        host: null,
      });
    }
  }

  function handleDuplicateItemsOpenChange(open: boolean) {
    setDuplicateItemsOpen(open);
    if (!open) {
      setDuplicateItems([]);
    }
  }

  async function scrapeRecipe(nextUrl: string) {
    const res = await fetch("/api/recipe-scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: nextUrl }),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        payload && typeof payload === "object" && payload !== null && "error" in payload
          ? String((payload as { error?: unknown }).error ?? "")
          : "Kunde inte hämta ingredienser.";
      throw new Error(message || "Kunde inte hämta ingredienser.");
    }

    return {
      title: extractTitle(payload),
      ingredients: extractIngredients(payload),
      instructions: extractString(payload, "instructions"),
      yields: extractString(payload, "yields"),
      total_time: extractNonNegativeInt(payload, "total_time"),
      image_url: extractString(payload, "image_url") ?? extractString(payload, "image"),
      host: extractString(payload, "host"),
    };
  }

  async function handleAddRecipe(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nextTitle = title.trim();
    const nextUrl = coerceHttpsUrl(url);

    if (!nextUrl && !nextTitle) {
      setFormError("Ange en URL eller titel till receptet.");
      return;
    }

    if(!nextUrl && nextTitle) {
      try {
        await addRecipe(nextTitle, ""); // or null (see note below)
        setTitle("");
        setUrl("");
        toast.success("Recept tillagt.");
      } catch {
          setFormError("Kunde inte lägga till receptet.");
      }
    return;
    }

    try {
      new URL(nextUrl);
    } catch {
      setFormError("URL:en verkar vara ogiltig.");
      return;
    }

    const titleWasEmpty = nextTitle.length === 0;

    setIngredientsOpen(true);
    setScrapeState({
      status: "loading",
      ingredients: [],
      title: null,
      sourceUrl: nextUrl,
      error: null,
      instructions: null,
      yields: null,
      total_time: null,
      image_url: null,
      host: null,
    });

    const scrapePromise = scrapeRecipe(nextUrl)
      .then((result) => {
        setScrapeState({
          status: "success",
          ingredients: result.ingredients,
          title: result.title,
          sourceUrl: nextUrl,
          error: null,
          instructions: result.instructions,
          yields: result.yields,
          total_time: result.total_time,
          image_url: result.image_url,
          host: result.host,
        });
        return result;
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Kunde inte hämta ingredienser.";
        setScrapeState({
          status: "error",
          ingredients: [],
          title: null,
          sourceUrl: nextUrl,
          error: message,
          instructions: null,
          yields: null,
          total_time: null,
          image_url: null,
          host: null,
        });
        return null;
      });

    try {
      const createdId = await addRecipe(nextTitle, nextUrl);
      setTitle("");
      setUrl("");

      const scrapeResult = await scrapePromise;
      if (scrapeResult) {
        await updateRecipe(createdId, {
          ...(titleWasEmpty && scrapeResult.title ? { title: scrapeResult.title } : {}),
          ingredients: scrapeResult.ingredients,
          instructions: scrapeResult.instructions,
          yields: scrapeResult.yields,
          total_time: scrapeResult.total_time,
          image_url: scrapeResult.image_url,
          host: scrapeResult.host,
        });
      }
    } catch {
      setFormError("Kunde inte lägga till receptet.");
      setIngredientsOpen(false);
    }
  }

  if (recipesLoading) {
    return (
      <main className="min-h-screen p-3 sm:p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Laddar recept…</p>
      </main>
    );
  }

  if (recipesError) {
    return (
      <main className="min-h-screen p-3 sm:p-4 flex items-center justify-center">
        <p className="text-destructive">{recipesError}</p>
      </main>
    );
  }

  const normalizeItemText = (s: string) => s.trim().toLocaleLowerCase("sv-SE");

  async function handleAddSelectedIngredients(lines: string[]) {
    if (boardLoading || boardError) return;
    if (!lines || lines.length === 0) return;

    let addedCount = 0;
    const foundDuplicates: string[] = [];

    await setBoard((prev) => {
      const next: BoardState = structuredClone(prev);

      const existingNormalized = new Set(
        Object.values(next.items).map((item) => normalizeItemText(item.text))
      );
      const reportedDuplicates = new Set<string>();

      for (const rawLine of lines) {
        const { columnId, normalized } = suggestColumnForIngredient(rawLine, store, next);
        const text = normalized.trim();
        if (!text) continue;

        const key = normalizeItemText(text);
        if (existingNormalized.has(key) && !reportedDuplicates.has(key)) {
          foundDuplicates.push(text);
          reportedDuplicates.add(key);
        }

        const id = newItemId();
        next.items[id] = { id, text, checked: false };

        const targetColumnId = next.columns[columnId]
          ? columnId
          : next.columnOrder[0] ?? columnId;
        if (!next.columns[targetColumnId]) continue;

        next.columns[targetColumnId].itemIds.unshift(id);
        addedCount++;
      }

      return next;
    });

    if (addedCount === 0) {
      toast.message("Inga nya ingredienser att lägga till.");
      return;
    }

    const plural = addedCount === 1 ? "ingrediens" : "ingredienser";
    const verb = addedCount === 1 ? "tillagd" : "tillagda";
    toast.success(`${addedCount} ${plural} ${verb}.`);

    if (foundDuplicates.length > 0) {
      setDuplicateItems(foundDuplicates);
      setDuplicateItemsOpen(true);
    }
  }

  return (
    <main className="min-h-screen p-3 sm:p-4 space-y-3 max-w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {/* Edit Dialog (rendered once at page level) */}
                <EditRecipeDialog
                  open={editOpen}
                  onOpenChange={handleEditOpenChange}
                  title={editTitle}
                  onTitleChange={setEditTitle}
                  url={editUrl}
                  onUrlChange={setEditUrl}
                  onSubmit={handleSaveEdit}
                />
          <RecipeIngredientsDialog
            open={ingredientsOpen}
            onOpenChange={handleIngredientsOpenChange}
            status={scrapeState.status === "idle" ? "loading" : scrapeState.status}
            ingredients={scrapeState.ingredients}
            error={scrapeState.status === "error" ? scrapeState.error : null}
            sourceUrl={scrapeState.sourceUrl}
            title={scrapeState.title}
            onAddSelected={!boardLoading && !boardError ? handleAddSelectedIngredients : undefined}
          />
          <Dialog open={duplicateItemsOpen} onOpenChange={handleDuplicateItemsOpenChange}>
            <DialogContent className="sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle>Dubbletter tillagda</DialogTitle>
                <DialogDescription>
                  {duplicateItems.length} ingrediens(er) fanns redan i listan.
                  De lades till ändå så att du kan hantera dem manuellt.
                </DialogDescription>
              </DialogHeader>
              <ul className="text-sm space-y-2 max-h-72 overflow-y-auto">
                {duplicateItems.map((item, idx) => (
                  <li key={`${idx}-${item}`} className="wrap-break-words">
                    {item}
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button type="button" onClick={() => handleDuplicateItemsOpenChange(false)}>
                  Okej
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <h1 className="text-lg sm:text-2xl font-semibold leading-tight wrap-break-word">
            Recept
          </h1>
          <p className="text-sm text-muted-foreground">Lägg till och öppna recept för listan.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="touch-manipulation">
          <Link href={`/l/${listId}?store=${store}`}>Tillbaka</Link>
        </Button>
      </div>

      <form onSubmit={handleAddRecipe} className="grid gap-4">
        <div className="grid gap-3">
          <Label htmlFor="recipe-title">Recepttitel</Label>
          <Input
            id="recipe-title"
            name="recipeTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pasta Carbonara"
            autoFocus
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="recipe-url">URL</Label>
          <Input
            id="recipe-url"
            name="recipeUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <div className="flex justify-end">
          <Button type="submit">Lägg till</Button>
        </div>
      </form>

      <div className="grid gap-2">
        {recipes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga recept tillagda ännu.</p>
        ) : (
          recipes.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="font-medium wrap-break-words sm:truncate">{r.title}</div>
                {r.total_time !== null ? (
                  <div className="text-xs text-muted-foreground">Tid: {r.total_time} min</div>
                ) : null}
                <div className="hidden text-xs text-muted-foreground sm:block sm:wrap-break-words sm:whitespace-normal">
                  {r.url}
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEditDialog(r)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteRecipe(r.id)}
                >
                  <Trash2Icon />
                </Button>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={`/l/${listId}/recipes/${r.id}?store=${store}`}>Mer info</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <a href={r.url} target="_blank" rel="noreferrer noopener">
                    Öppna
                  </a>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
