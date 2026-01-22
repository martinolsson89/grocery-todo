import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  BoardState,
  DEFAULT_STORE,
  getDefaultBoardForStore,
  getStoreTemplateId,
  StoreKey,
} from "../types";
import type { ListColumn, ListItem } from "@/src/lib/supabase/types";

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

  const supabase = useMemo(() => createClient(), []);

  const formatInList = (values: string[]) =>
    `(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(",")})`;

  const switchStoreTemplate = useCallback(
    async (nextStore: StoreKey) => {
      const nextTemplateId = getStoreTemplateId(nextStore);

      const { data: templateColumns, error: templateColumnsError } = await supabase
        .from("store_template_columns")
        .select("id, title, sort_order")
        .eq("template_id", nextTemplateId)
        .order("sort_order");

      if (templateColumnsError) {
        console.error(
          "Error fetching template columns:",
          templateColumnsError.message,
          templateColumnsError.code,
          templateColumnsError.details
        );
        setError(`Failed to load store template: ${templateColumnsError.message}`);
        return false;
      }

      const templateIds = (templateColumns ?? []).map((col) => col.id);
      if (!templateIds.includes("ovrigt")) {
        setError("Store template is missing the ovrigt column.");
        return false;
      }

      const { error: updateListError } = await supabase
        .from("grocery_lists")
        .update({ store: nextStore, store_template_id: nextTemplateId })
        .eq("id", listId);

      if (updateListError) {
        console.error(
          "Error updating list store template:",
          updateListError.message,
          updateListError.code,
          updateListError.details
        );
        setError(`Failed to update store: ${updateListError.message}`);
        return false;
      }

      const columnsToUpsert = (templateColumns ?? []).map((col) => ({
        id: col.id,
        list_id: listId,
        title: col.title,
        sort_order: col.sort_order ?? 0,
      }));

      if (columnsToUpsert.length > 0) {
        const { error: upsertColumnsError } = await supabase
          .from("list_columns")
          .upsert(columnsToUpsert, { onConflict: "list_id,id" });

        if (upsertColumnsError) {
          console.error(
            "Error upserting list columns:",
            upsertColumnsError.message,
            upsertColumnsError.code,
            upsertColumnsError.details
          );
          setError(`Failed to update columns: ${upsertColumnsError.message}`);
          return false;
        }

        const updateResults = await Promise.all(
          columnsToUpsert.map((col) =>
            supabase
              .from("list_columns")
              .update({ title: col.title, sort_order: col.sort_order })
              .eq("list_id", listId)
              .eq("id", col.id)
          )
        );

        const updateError = updateResults.find((res) => res.error)?.error;
        if (updateError) {
          console.error(
            "Error syncing column order:",
            updateError.message,
            updateError.code,
            updateError.details
          );
          setError(`Failed to sync column order: ${updateError.message}`);
          return false;
        }
      }

      if (templateIds.length > 0) {
        const inList = formatInList(templateIds);
        const { error: remapItemsError } = await supabase
          .from("list_items")
          .update({ column_id: "ovrigt" })
          .eq("list_id", listId)
          .not("column_id", "in", inList);

        if (remapItemsError) {
          console.error(
            "Error remapping items:",
            remapItemsError.message,
            remapItemsError.code,
            remapItemsError.details
          );
          setError(`Failed to remap items: ${remapItemsError.message}`);
          return false;
        }

        const { error: deleteColumnsError } = await supabase
          .from("list_columns")
          .delete()
          .eq("list_id", listId)
          .not("id", "in", inList);

        if (deleteColumnsError) {
          console.error(
            "Error removing old columns:",
            deleteColumnsError.message,
            deleteColumnsError.code,
            deleteColumnsError.details
          );
          setError(`Failed to clean up columns: ${deleteColumnsError.message}`);
          return false;
        }
      }

      return true;
    },
    [listId, supabase]
  );

  // Convert database rows to BoardState
  const dbToBoardState = useCallback(
    (columns: ListColumn[], items: ListItem[]): BoardState => {
      const boardColumns: Record<string, { id: string; title: string; itemIds: string[] }> = {};
      const boardItems: Record<string, { id: string; text: string; checked: boolean }> = {};

      // Sort columns by sort_order
      const sortedColumns = [...columns].sort((a, b) => a.sort_order - b.sort_order);

      // Create column map
      for (const col of sortedColumns) {
        boardColumns[col.id] = {
          id: col.id,
          title: col.title,
          itemIds: [],
        };
      }

      // Sort items by sort_order within each column
      const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

      // Add items to their columns
      for (const item of sortedItems) {
        boardItems[item.id] = {
          id: item.id,
          text: item.text,
          checked: item.checked,
        };
        if (boardColumns[item.column_id]) {
          boardColumns[item.column_id].itemIds.push(item.id);
        }
      }

      return {
        items: boardItems,
        columns: boardColumns,
        columnOrder: sortedColumns.map((c) => c.id),
      };
    },
    []
  );

  // Initialize list if it doesn't exist
  const initializeList = useCallback(async () => {
    const desiredTemplateId = getStoreTemplateId(storeKey);

    // Check if list exists
    const { data: existingList, error: checkError } = await supabase
      .from("grocery_lists")
      .select("id, store, store_template_id")
      .eq("id", listId)
      .single();

    // PGRST116 means no rows found, which is expected for new lists
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking list:", checkError.message, checkError.code, checkError.details);
      setError(`Failed to check list: ${checkError.message}`);
      return false;
    }

    const activeTemplateId = existingList?.store_template_id ?? desiredTemplateId;

    if (
      shouldSyncStore &&
      existingList &&
      existingList.store_template_id &&
      existingList.store_template_id !== desiredTemplateId
    ) {
      const switched = await switchStoreTemplate(storeKey);
      if (!switched) return false;
    }

    if (!existingList) {
      // Create the list
      const listInsertPayloadWithStore = {
        id: listId,
        store: storeKey,
        store_template_id: desiredTemplateId,
      };
      const { error: listError } = await supabase
        .from("grocery_lists")
        // store/store_template_id columns are expected after migrations
        .insert(listInsertPayloadWithStore);

      if (listError) {
        if (listError.code === "PGRST204" || listError.code === "42703") {
          setError("Database schema is missing store templates. Run the latest migrations.");
          return false;
        }
        // Handle duplicate key - list was created by another request
        if (listError.code === "23505") {
          // List already exists, this is fine - proceed normally
          return true;
        }
        console.error("Error creating list:", listError.message, listError.code, listError.details);
        setError(`Failed to create list: ${listError.message}`);
        return false;
      }

    } else {
      if (!existingList.store_template_id) {
        const { error: updateTemplateError } = await supabase
          .from("grocery_lists")
          .update({ store_template_id: desiredTemplateId, store: storeKey })
          .eq("id", listId);

        if (updateTemplateError) {
          console.error(
            "Error updating list store template:",
            updateTemplateError.message,
            updateTemplateError.code,
            updateTemplateError.details
          );
          // Non-fatal: fall through and continue loading columns/items.
        }
      }

      // Ensure template columns exist (handles partial seeding and later template additions)
      const { data: existingColumns, error: columnsQueryError } = await supabase
        .from("list_columns")
        .select("id, sort_order")
        .eq("list_id", listId);

      if (columnsQueryError) {
        console.error(
          "Error checking columns:",
          columnsQueryError.message,
          columnsQueryError.code,
          columnsQueryError.details
        );
        // Don't fail initialization on this; fetchBoard will show errors if needed
        return true;
      }

      const { data: templateColumns, error: templateColumnsError } = await supabase
        .from("store_template_columns")
        .select("id, title, sort_order")
        .eq("template_id", activeTemplateId)
        .order("sort_order");

      if (templateColumnsError) {
        console.error(
          "Error fetching template columns:",
          templateColumnsError.message,
          templateColumnsError.code,
          templateColumnsError.details
        );
        return true;
      }

      const existingIds = new Set((existingColumns ?? []).map((c: { id: string; sort_order: number | null }) => c.id));
      const missingColumns = (templateColumns ?? []).filter((col) => !existingIds.has(col.id));
      if (missingColumns.length > 0) {
        const columnsToInsert = missingColumns.map((col) => ({
          id: col.id,
          list_id: listId,
          title: col.title,
          sort_order: col.sort_order ?? 0,
        }));

        const { error: columnsError } = await supabase.from("list_columns").insert(columnsToInsert);
        if (columnsError && columnsError.code !== "23505") {
          console.error(
            "Error creating missing columns (existing list):",
            columnsError.message,
            columnsError.code,
            columnsError.details
          );
          setError(`Failed to create columns: ${columnsError.message}`);
          return false;
        }
      }
    }

    return true;
  }, [listId, supabase, storeKey, shouldSyncStore, switchStoreTemplate]);

  // Fetch board data from Supabase
  const fetchBoard = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const initialized = await initializeList();
      if (!initialized) {
        setIsLoading(false);
        return;
      }

      // Fetch columns
      const { data: columns, error: columnsError } = await supabase
        .from("list_columns")
        .select("*")
        .eq("list_id", listId)
        .order("sort_order");

      if (columnsError) {
        console.error("Error fetching columns:", columnsError);
        setError("Failed to load columns");
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

      const newBoard = dbToBoardState(columns || [], items || []);
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

    // Subscribe to changes on list_columns
    const columnsChannel = supabase
      .channel(`list_columns:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_columns",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          fetchBoard(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(columnsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, supabase]);

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
          column_id: string;
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
                column_id: colId,
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
