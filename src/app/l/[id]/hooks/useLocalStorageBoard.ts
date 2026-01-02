import { useCallback, useMemo, useSyncExternalStore } from "react";
import { BoardState, DEFAULT_BOARD } from "../types";
import { storageKey } from "../utils";

export function useLocalStorageBoard(listId: string) {
  const key = storageKey(listId);

  const subscribe = useCallback(
    (callback: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) callback();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    const raw = localStorage.getItem(key);
    return raw ?? null;
  }, [key]);

  const getServerSnapshot = useCallback(() => null, []);

  const rawValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const board = useMemo<BoardState>(() => {
    if (!rawValue) return DEFAULT_BOARD;
    try {
      return JSON.parse(rawValue) as BoardState;
    } catch {
      return DEFAULT_BOARD;
    }
  }, [rawValue]);

  const setBoard = useCallback(
    (updater: BoardState | ((prev: BoardState) => BoardState)) => {
      const currentRaw = localStorage.getItem(key);
      const current = currentRaw ? (JSON.parse(currentRaw) as BoardState) : DEFAULT_BOARD;
      const next = typeof updater === "function" ? updater(current) : updater;
      localStorage.setItem(key, JSON.stringify(next));
      // Trigger re-render by dispatching a storage event
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
    [key]
  );

  return [board, setBoard] as const;
}
