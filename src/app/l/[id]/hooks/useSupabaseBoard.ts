import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { BoardState, DEFAULT_BOARD } from "../types";
import type { ListColumn, ListItem } from "@/src/lib/supabase/types";

/**
 * Hook to sync board state with Supabase.
 * Provides real-time updates and persists changes to the database.
 */
export function useSupabaseBoard(listId: string) {
  const [board, setBoardState] = useState<BoardState>(DEFAULT_BOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

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
    // Check if list exists
    const { data: existingList, error: checkError } = await supabase
      .from("grocery_lists")
      .select("id")
      .eq("id", listId)
      .single();

    // PGRST116 means no rows found, which is expected for new lists
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking list:", checkError.message, checkError.code, checkError.details);
      setError(`Failed to check list: ${checkError.message}`);
      return false;
    }

    if (!existingList) {
      // Create the list
      const { error: listError } = await supabase
        .from("grocery_lists")
        .insert({ id: listId });

      if (listError) {
        // Handle duplicate key - list was created by another request
        if (listError.code === "23505") {
          // List already exists, this is fine - proceed normally
          return true;
        }
        console.error("Error creating list:", listError.message, listError.code, listError.details);
        setError(`Failed to create list: ${listError.message}`);
        return false;
      }

      // Create default columns
      const columnsToInsert = DEFAULT_BOARD.columnOrder.map((colId, index) => ({
        id: colId,
        list_id: listId,
        title: DEFAULT_BOARD.columns[colId].title,
        sort_order: index,
      }));

      const { error: columnsError } = await supabase
        .from("list_columns")
        .insert(columnsToInsert);

      if (columnsError) {
        // Also handle duplicate columns gracefully
        if (columnsError.code === "23505") {
          return true;
        }
        console.error("Error creating columns:", columnsError.message, columnsError.code, columnsError.details);
        setError(`Failed to create columns: ${columnsError.message}`);
        return false;
      }
    }

    return true;
  }, [listId, supabase]);

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

      // Reset local state
      setBoardState(DEFAULT_BOARD);
    } catch (err) {
      console.error("Error resetting board:", err);
    }
  }, [listId, supabase]);

  return { board, setBoard, isLoading, error, resetBoard };
}
