import type { BoardState } from "./types";

export function storageKey(listId: string) {
  return `grocery-todo:list:${listId}`;
}

export function newItemId() {
  return Math.random().toString(36).slice(2, 10);
}

export function findContainer(state: BoardState, id: string) {
  // If id is a column id
  if (state.columns[id]) return id;

  // Else find which column contains the item
  for (const colId of state.columnOrder) {
    if (state.columns[colId].itemIds.includes(id)) return colId;
  }
  return null;
}
