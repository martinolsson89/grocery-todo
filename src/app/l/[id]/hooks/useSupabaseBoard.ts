import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  BoardState,
  DEFAULT_STORE,
  getDefaultBoardForStore,
  getStoreTemplateId,
  StoreKey,
} from "../types";
import type { ListItem } from "@/src/lib/supabase/types";

type CategoryColumn = {
  id: string;
  title: string;
  sort_order: number;
};

type TemplateCategoryRow = {
  category_id: string;
  sort_order: number;
};

/**
 * Hook to sync board state with Supabase.
 * Provides real-time updates and persists changes to the database.
 */
export function useSupabaseBoard(listId: string, store?: StoreKey, shouldSyncStore = false) {
  const storeKey = store ?? DEFAULT_STORE;
  const [board, setBoardState] = useState<BoardState>(() => getDefaultBoardForStore(storeKey));
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const switchStoreTemplate = useCallback(
    async (nextStore: StoreKey) => {
      const nextTemplateId = getStoreTemplateId(nextStore);

      const { data: templateCategories, error: templateCategoriesError } = await supabase
        .from("store_template_category_order")
        .select("category_id, sort_order")
        .eq("template_id", nextTemplateId)
        .order("sort_order");

      if (templateCategoriesError) {
        console.error(
          "Error fetching template categories:",
          templateCategoriesError.message,
          templateCategoriesError.code,
          templateCategoriesError.details
        );
        setError(`Failed to load store template: ${templateCategoriesError.message}`);
        return false;
      }

      const templateIds = (templateCategories ?? []).map((row) => row.category_id);
      if (templateIds.length === 0) {
        setError("Store template has no categories.");
        return false;
      }

      const { error: updateListError } = await supabase
        .from("grocery_lists")
        .update({ store_template_id: nextTemplateId })
        .eq("id", listId);

      if (updateListError) {
        console.error(
          "Error updating list store template:",
          updateListError.message,
          updateListError.code,
          updateListError.details
        );
        setError(`Failed to update template: ${updateListError.message}`);
        return false;
      }

      return true;
    },
    [listId, supabase]
  );

  // Convert database rows to BoardState
  const dbToBoardState = useCallback(
    (categories: CategoryColumn[], items: ListItem[]): BoardState => {
      const boardColumns: Record<string, { id: string; title: string; itemIds: string[] }> = {};
      const boardItems: Record<string, { id: string; text: string; checked: boolean }> = {};

      const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

      for (const category of sortedCategories) {
        boardColumns[category.id] = {
          id: category.id,
          title: category.title,
          itemIds: [],
        };
      }

      const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

      for (const item of sortedItems) {
        boardItems[item.id] = {
          id: item.id,
          text: item.text,
          checked: item.checked,
        };
        if (boardColumns[item.category_id]) {
          boardColumns[item.category_id].itemIds.push(item.id);
        }
      }

      return {
        items: boardItems,
        columns: boardColumns,
        columnOrder: sortedCategories.map((c) => c.id),
      };
    },
    []
  );

  // Initialize list if it doesn't exist
  const initializeList = useCallback(async (): Promise<string | null> => {
    const desiredTemplateId = getStoreTemplateId(storeKey);

    // Check if list exists
    const { data: existingList, error: checkError } = await supabase
      .from("grocery_lists")
      .select("id, store_template_id")
      .eq("id", listId)
      .single();

    // PGRST116 means no rows found, which is expected for new lists
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking list:", checkError.message, checkError.code, checkError.details);
      setError(`Failed to check list: ${checkError.message}`);
      return null;
    }

    let activeTemplateId = existingList?.store_template_id ?? desiredTemplateId;

    if (
      shouldSyncStore &&
      existingList &&
      existingList.store_template_id &&
      existingList.store_template_id !== desiredTemplateId
    ) {
      const switched = await switchStoreTemplate(storeKey);
      if (!switched) return null;
      activeTemplateId = desiredTemplateId;
    }

    if (!existingList) {
      // Create the list
      const listInsertPayload = {
        id: listId,
        store_template_id: desiredTemplateId,
      };
      const { error: listError } = await supabase
        .from("grocery_lists")
        .insert(listInsertPayload);

      if (listError) {
        if (listError.code === "PGRST204" || listError.code === "42703") {
          setError("Database schema is missing store templates. Run the latest migrations.");
          return null;
        }
        // Handle duplicate key - list was created by another request
        if (listError.code === "23505") {
          // List already exists, this is fine - proceed normally
          return activeTemplateId;
        }
        console.error("Error creating list:", listError.message, listError.code, listError.details);
        setError(`Failed to create list: ${listError.message}`);
        return null;
      }

    } else {
      if (!existingList.store_template_id) {
        const { error: updateTemplateError } = await supabase
          .from("grocery_lists")
          .update({ store_template_id: desiredTemplateId })
          .eq("id", listId);

        if (updateTemplateError) {
          console.error(
            "Error updating list store template:",
            updateTemplateError.message,
            updateTemplateError.code,
            updateTemplateError.details
          );
          // Non-fatal: fall through and continue loading columns/items.
        } else {
          activeTemplateId = desiredTemplateId;
        }
      }
    }

    return activeTemplateId;
  }, [listId, supabase, storeKey, shouldSyncStore, switchStoreTemplate]);

  // Fetch board data from Supabase
  const fetchBoard = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const templateId = await initializeList();
      if (!templateId) {
        setIsLoading(false);
        return;
      }

      setActiveTemplateId(templateId);

      const { data: templateRows, error: templateError } = await supabase
        .from("store_template_category_order")
        .select("category_id, sort_order")
        .eq("template_id", templateId)
        .order("sort_order");

      if (templateError) {
        console.error("Error fetching template categories:", templateError);
        setError("Failed to load categories");
        setIsLoading(false);
        return;
      }

      const templateCategoryIds = [...new Set((templateRows ?? []).map((row) => row.category_id))];
      const categoryTitleById = new Map<string, string>();
      if (templateCategoryIds.length > 0) {
        const { data: categoryRows, error: categoryError } = await supabase
          .from("categories")
          .select("id, title")
          .in("id", templateCategoryIds);

        if (categoryError) {
          console.error("Error fetching categories:", categoryError);
          setError("Failed to load categories");
          setIsLoading(false);
          return;
        }

        for (const row of categoryRows ?? []) {
          categoryTitleById.set(row.id, row.title);
        }
      }

      const templateCategories: CategoryColumn[] = (templateRows ?? []).map(
        (row: TemplateCategoryRow) => ({
          id: row.category_id,
          title: categoryTitleById.get(row.category_id) ?? row.category_id,
          sort_order: row.sort_order,
        })
      );

      if (templateCategories.length === 0) {
        setError("Store template has no categories.");
        setIsLoading(false);
        return;
      }

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", listId)
        .order("sort_order");

      if (itemsError) {
        console.error("Error fetching items:", itemsError);
        setError("Failed to load items");
        setIsLoading(false);
        return;
      }

      const templateCategoryIdSet = new Set(templateCategories.map((category) => category.id));
      const extraCategoryIds = [
        ...new Set(
          (items ?? [])
            .map((item) => item.category_id)
            .filter((categoryId) => !templateCategoryIdSet.has(categoryId))
        ),
      ];

      let extraCategories: CategoryColumn[] = [];
      if (extraCategoryIds.length > 0) {
        const { data: extraRows, error: extraError } = await supabase
          .from("categories")
          .select("id, title")
          .in("id", extraCategoryIds);

        if (extraError) {
          console.error("Error fetching extra categories:", extraError);
          setError("Failed to load extra categories");
          extraCategories = extraCategoryIds.map((id, index) => ({
            id,
            title: id,
            sort_order: 1000000 + index,
          }));
        } else {
          const baseSort = 1000000;
          const sortedExtra = [...(extraRows ?? [])].sort((a, b) =>
            a.title.localeCompare(b.title)
          );
          extraCategories = sortedExtra.map((row, index) => ({
            id: row.id,
            title: row.title,
            sort_order: baseSort + index,
          }));

          const foundIds = new Set((extraRows ?? []).map((row) => row.id));
          for (const missingId of extraCategoryIds) {
            if (!foundIds.has(missingId)) {
              extraCategories.push({
                id: missingId,
                title: missingId,
                sort_order: baseSort + extraCategories.length,
              });
            }
          }
        }
      }

      const newBoard = dbToBoardState([...templateCategories, ...extraCategories], items || []);
      setBoardState(newBoard);
      setIsInitialized(true);
    } catch (err) {
      console.error("Error fetching board:", err);
      setError("Failed to load board");
    } finally {
      setIsLoading(false);
    }
  }, [listId, supabase, initializeList, dbToBoardState]);

  const switchStore = useCallback(
    async (nextStore: StoreKey) => {
      setError(null);
      const switched = await switchStoreTemplate(nextStore);
      if (!switched) return false;
      await fetchBoard(true);
      return true;
    },
    [fetchBoard, switchStoreTemplate]
  );

  // Set up real-time subscriptions
  useEffect(() => {
    // Only show loading spinner on initial fetch
    fetchBoard(!isInitialized);

    // Subscribe to changes on list_items
    const itemsChannel = supabase
      .channel(`list_items:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          // Refetch silently (no loading spinner) on real-time updates
          fetchBoard(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
    };
     
  }, [listId, supabase, fetchBoard, isInitialized]);

  useEffect(() => {
    if (!activeTemplateId) return;

    const templateChannel = supabase
      .channel(`store_template_category_order:${activeTemplateId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "store_template_category_order",
          filter: `template_id=eq.${activeTemplateId}`,
        },
        () => {
          fetchBoard(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(templateChannel);
    };
  }, [activeTemplateId, fetchBoard, supabase]);

  // Update board state and sync to Supabase
  const setBoard = useCallback(
    async (updater: BoardState | ((prev: BoardState) => BoardState)) => {
      const newBoard = typeof updater === "function" ? updater(board) : updater;

      // Optimistic update
      setBoardState(newBoard);

      // Sync items to Supabase
      try {
        // Get current items from DB
        const { data: currentItems } = await supabase
          .from("list_items")
          .select("id")
          .eq("list_id", listId);

        const currentItemIds = new Set<string>((currentItems || []).map((i: { id: string }) => i.id));
        const newItemIds = new Set(Object.keys(newBoard.items));

        // Items to delete
        const itemsToDelete = [...currentItemIds].filter((id) => !newItemIds.has(id));
        if (itemsToDelete.length > 0) {
          await supabase
            .from("list_items")
            .delete()
            .eq("list_id", listId)
            .in("id", itemsToDelete);
        }

        // Items to upsert
        const itemsToUpsert: Array<{
          id: string;
          list_id: string;
          category_id: string;
          text: string;
          checked: boolean;
          sort_order: number;
        }> = [];

        for (const colId of newBoard.columnOrder) {
          const column = newBoard.columns[colId];
          for (let i = 0; i < column.itemIds.length; i++) {
            const itemId = column.itemIds[i];
            const item = newBoard.items[itemId];
            if (item) {
              itemsToUpsert.push({
                id: item.id,
                list_id: listId,
                category_id: colId,
                text: item.text,
                checked: item.checked,
                sort_order: i,
              });
            }
          }
        }

        if (itemsToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from("list_items")
            .upsert(itemsToUpsert, { onConflict: "id" });

          if (upsertError) {
            console.error("Error upserting items:", upsertError);
          }
        }
      } catch (err) {
        console.error("Error syncing to Supabase:", err);
        // Refetch to get accurate state
        fetchBoard();
      }
    },
    [board, listId, supabase, fetchBoard]
  );

  // Reset board to default
  const resetBoard = useCallback(async () => {
    try {
      // Delete all items
      await supabase.from("list_items").delete().eq("list_id", listId);

      // Refresh state (columns remain)
      await fetchBoard(false);
    } catch (err) {
      console.error("Error resetting board:", err);
    }
  }, [listId, supabase, fetchBoard]);

  return { board, setBoard, isLoading, error, resetBoard, switchStore };
}
