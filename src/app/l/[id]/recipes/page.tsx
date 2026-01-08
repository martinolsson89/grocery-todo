"use client";

import Link from "next/link";
import { use, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useSupabaseRecipes } from "../hooks/useSupabaseRecipes";

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
  const [formError, setFormError] = useState<string | null>(null);

  const { recipes, isLoading, error, addRecipe, deleteRecipe } = useSupabaseRecipes(listId);

  async function handleAddRecipe(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nextTitle = title.trim();
    const nextUrl = coerceHttpsUrl(url);

    if (!nextTitle) {
      setFormError("Ange en recepttitel.");
      return;
    }

    if (!nextUrl) {
      setFormError("Ange en URL till receptet.");
      return;
    }

    try {
      new URL(nextUrl);
    } catch {
      setFormError("URL:en verkar vara ogiltig.");
      return;
    }

    try {
      await addRecipe(nextTitle, nextUrl);
      setTitle("");
      setUrl("");
    } catch {
      setFormError("Kunde inte lägga till receptet.");
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen p-3 sm:p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Laddar recept…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-3 sm:p-4 flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </main>
    );
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

      <form onSubmit={handleAddRecipe} className="grid gap-4">
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
                <div className="hidden text-xs text-muted-foreground sm:block sm:wrap-break-words sm:whitespace-normal">
                  {r.url}
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRecipe(r.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Ta bort
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
