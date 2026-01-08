import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { createClient } from "@/src/lib/supabase/server";

function formatMinutes(totalTime: number | null) {
  if (totalTime === null) return null;
  const minutes = Math.trunc(totalTime);
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  return `${minutes} min`;
}

export default async function RecipeDetailsPage({
  params,
}: {
  params: Promise<{ id: string; recipeId: string }>;
}) {
  const { id: listId, recipeId } = await params;

  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .eq("list_id", listId)
    .single();

  if (error || !recipe) {
    notFound();
  }

  const title = (recipe.title ?? "").trim() || "(Utan titel)";
  const minutes = formatMinutes(recipe.total_time);

  return (
    <main className="min-h-screen p-3 sm:p-4 space-y-3 max-w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-semibold leading-tight wrap-break-word">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground wrap-break-words">
            {recipe.host ? `${recipe.host} · ` : null}
            {recipe.url}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="touch-manipulation">
          <Link href={`/l/${listId}/recipes`}>Tillbaka</Link>
        </Button>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Mer info</CardTitle>
          <CardDescription>
            <a
              className="underline underline-offset-4"
              href={recipe.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              Öppna originalrecept
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1">
            {minutes ? (
              <div className="text-sm">
                <span className="text-muted-foreground">Tid:</span> {minutes}
              </div>
            ) : null}
            {recipe.yields ? (
              <div className="text-sm">
                <span className="text-muted-foreground">Ger:</span> {recipe.yields}
              </div>
            ) : null}
          </div>

          {recipe.image_url ? (
            // Using <img> because image_url can be any remote host.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.image_url}
              alt={title}
              className="w-full max-w-2xl rounded-md border"
            />
          ) : null}

          <section className="space-y-2">
            <h2 className="font-medium">Ingredienser</h2>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={`${idx}-${ingredient}`} className="wrap-break-words">
                    {ingredient}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Inga ingredienser sparade.</p>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="font-medium">Instruktioner</h2>
            {recipe.instructions ? (
              <p className="text-sm whitespace-pre-wrap wrap-break-words">
                {recipe.instructions}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Inga instruktioner sparade.</p>
            )}
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
