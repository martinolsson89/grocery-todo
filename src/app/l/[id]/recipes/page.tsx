"use client";

import Link from "next/link";
import { use, useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

type Recipe = {
  id: string;
  title: string;
  url: string;
};

function parseRecipes(raw: string | null): Recipe[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((x): Recipe | null => {
        if (typeof x !== "object" || x === null) return null;
        const obj = x as Record<string, unknown>;

        const id = obj.id;
        const title = obj.title;
        const url = obj.url;
        if (typeof id !== "string" || typeof title !== "string" || typeof url !== "string") {
          return null;
        }
        return { id, title, url };
      })
      .filter((x): x is Recipe => x !== null);
  } catch {
    return [];
  }
}

function useLocalStorageRecipes(storageKey: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === storageKey) callback();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [storageKey]
  );

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(storageKey);
  }, [storageKey]);

  const getServerSnapshot = useCallback(() => null, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const recipes = useMemo(() => parseRecipes(raw), [raw]);

  const setRecipes = useCallback(
    (updater: Recipe[] | ((prev: Recipe[]) => Recipe[])) => {
      const current = parseRecipes(localStorage.getItem(storageKey));
      const next = typeof updater === "function" ? updater(current) : updater;
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
    },
    [storageKey]
  );

  return [recipes, setRecipes] as const;
}

function coerceHttpsUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export default function RecipesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = use(params);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const storageKey = useMemo(
    () => `grocery-todo:list:${listId}:recipes`,
    [listId]
  );

  const [recipes, setRecipes] = useLocalStorageRecipes(storageKey);

  function addRecipe(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nextTitle = title.trim();
    const nextUrl = coerceHttpsUrl(url);

    if (!nextTitle) {
      setError("Ange en recepttitel.");
      return;
    }

    if (!nextUrl) {
      setError("Ange en URL till receptet.");
      return;
    }

    try {
      new URL(nextUrl);
    } catch {
      setError("URL:en verkar vara ogiltig.");
      return;
    }

    const id = Math.random().toString(36).slice(2, 10);
    setRecipes((prev) => [{ id, title: nextTitle, url: nextUrl }, ...prev]);
    setTitle("");
    setUrl("");
  }

  return (
    <main className="min-h-screen p-3 sm:p-4 space-y-3 max-w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-semibold leading-tight wrap-break-word">
            Recept
          </h1>
          <p className="text-sm text-muted-foreground">Lägg till och öppna recept för listan.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="touch-manipulation">
          <Link href={`/l/${listId}`}>Tillbaka</Link>
        </Button>
      </div>

      <form onSubmit={addRecipe} className="grid gap-4">
        <div className="grid gap-3">
          <Label htmlFor="recipe-title">Recepttitel</Label>
          <Input
            id="recipe-title"
            name="recipeTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
                <div className="hidden text-xs text-muted-foreground sm:block sm:wrap-break-words sm:whitespace-normal">
                  {r.url}
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 self-end sm:self-auto">
                <a href={r.url} target="_blank" rel="noreferrer noopener">
                  Öppna
                </a>
              </Button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
