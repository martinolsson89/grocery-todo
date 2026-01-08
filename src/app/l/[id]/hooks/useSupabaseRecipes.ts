import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import type { Recipe } from "@/src/lib/supabase/types";

export type RecipeItem = {
  id: string;
  title: string;
  url: string;
  total_time: number | null;
  ingredients: string[] | null;
  instructions: string | null;
  yields: string | null;
  image_url: string | null;
  host: string | null;
};

export type RecipeUpdate = {
  title?: string | null;
  url?: string;
  total_time?: number | null;
  ingredients?: string[] | null;
  instructions?: string | null;
  yields?: string | null;
  image_url?: string | null;
  host?: string | null;
};

/**
 * Hook to sync recipes with Supabase.
 * Provides real-time updates and persists changes to the database.
 */
export function useSupabaseRecipes(listId: string) {
  const [recipes, setRecipesState] = useState<RecipeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Convert database rows to RecipeItem[]
  const dbToRecipes = useCallback((rows: Recipe[]): RecipeItem[] => {
    return rows
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => ({
        id: r.id,
        title: r.title ?? "",
        url: r.url,
        total_time: r.total_time,
        ingredients: r.ingredients,
        instructions: r.instructions,
        yields: r.yields,
        image_url: r.image_url,
        host: r.host,
      }));
  }, []);

  // Fetch recipes from Supabase
  const fetchRecipes = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("recipes")
          .select("*")
          .eq("list_id", listId)
          .order("sort_order");

        if (fetchError) {
          console.error("Error fetching recipes:", fetchError);
          setError("Failed to load recipes");
          return;
        }

        setRecipesState(dbToRecipes(data || []));
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError("Failed to load recipes");
      } finally {
        setIsLoading(false);
      }
    },
    [listId, supabase, dbToRecipes]
  );

  // Set up real-time subscriptions
  useEffect(() => {
    fetchRecipes(true);

    const channel = supabase
      .channel(`recipes:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipes",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          fetchRecipes(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, supabase, fetchRecipes]);

  // Add a new recipe
  const addRecipe = useCallback(
    async (title: string, url: string, details?: RecipeUpdate): Promise<string> => {
      const id = Math.random().toString(36).slice(2, 10);

      const optimistic: RecipeItem = {
        id,
        title,
        url,
        total_time: details?.total_time ?? null,
        ingredients: details?.ingredients ?? null,
        instructions: details?.instructions ?? null,
        yields: details?.yields ?? null,
        image_url: details?.image_url ?? null,
        host: details?.host ?? null,
      };

      // Optimistic update - add to beginning
      setRecipesState((prev) => [optimistic, ...prev]);

      try {
        // Get current max sort_order and insert at 0, shifting others
        const { data: existing } = await supabase
          .from("recipes")
          .select("id, sort_order")
          .eq("list_id", listId);

        // Shift all existing recipes down
        if (existing && existing.length > 0) {
          const updates = existing.map((r: { id: string; sort_order: number }) => ({
            id: r.id,
            list_id: listId,
            sort_order: r.sort_order + 1,
          }));

          // Update sort_order for existing recipes
          for (const update of updates) {
            await supabase
              .from("recipes")
              .update({ sort_order: update.sort_order })
              .eq("id", update.id);
          }
        }

        // Insert new recipe at sort_order 0
        const normalizedTitle = title.trim();
        const { error: insertError } = await supabase.from("recipes").insert({
          id,
          list_id: listId,
          title: normalizedTitle ? normalizedTitle : null,
          url,
          sort_order: 0,
          total_time: details?.total_time,
          ingredients: details?.ingredients,
          instructions: details?.instructions,
          yields: details?.yields,
          image_url: details?.image_url,
          host: details?.host,
        });

        if (insertError) {
          console.error("Error adding recipe:", insertError);
          // Rollback optimistic update
          fetchRecipes(false);
          throw new Error(insertError.message);
        }

        return id;
      } catch (err) {
        console.error("Error adding recipe:", err);
        fetchRecipes(false);
        throw err;
      }
    },
    [listId, supabase, fetchRecipes]
  );

  // Delete a recipe
  const deleteRecipe = useCallback(
    async (id: string) => {
      // Optimistic update
      setRecipesState((prev) => prev.filter((r) => r.id !== id));

      try {
        const { error: deleteError } = await supabase
          .from("recipes")
          .delete()
          .eq("id", id);

        if (deleteError) {
          console.error("Error deleting recipe:", deleteError);
          fetchRecipes(false);
        }
      } catch (err) {
        console.error("Error deleting recipe:", err);
        fetchRecipes(false);
      }
    },
    [supabase, fetchRecipes]
  );

  // Update a recipe
  const updateRecipe = useCallback(
    async (id: string, updates: RecipeUpdate) => {
      const { title, ...rest } = updates;

      const optimisticUpdates: Partial<RecipeItem> = {
        ...rest,
        ...(title !== undefined ? { title: title ?? "" } : {}),
      };

      // Optimistic update
      setRecipesState((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...optimisticUpdates } : r))
      );

      try {
        const { error: updateError } = await supabase
          .from("recipes")
          .update(updates)
          .eq("id", id);

        if (updateError) {
          console.error("Error updating recipe:", updateError);
          fetchRecipes(false);
        }
      } catch (err) {
        console.error("Error updating recipe:", err);
        fetchRecipes(false);
      }
    },
    [supabase, fetchRecipes]
  );

  return {
    recipes,
    isLoading,
    error,
    addRecipe,
    deleteRecipe,
    updateRecipe,
  };
}
