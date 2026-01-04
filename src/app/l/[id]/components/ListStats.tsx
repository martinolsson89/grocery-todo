"use client";

import { useMemo } from "react";

import type { BoardState } from "../types";

export function ListStats({ board }: { board: BoardState }) {
  const { total, checked } = useMemo(() => {
    const ids = board.columnOrder.flatMap((colId) => board.columns[colId]?.itemIds ?? []);

    let totalCount = 0;
    let checkedCount = 0;

    for (const id of ids) {
      const item = board.items[id];
      if (!item) continue;

      totalCount += 1;
      if (item.checked) checkedCount += 1;
    }

    return { total: totalCount, checked: checkedCount };
  }, [board]);

  return (
    <div className="text-xs sm:text-sm text-muted-foreground">
      <span>{total} varor</span>
      <span className="mx-2">•</span>
      <span>{checked} avprickade</span>
    </div>
  );
}
