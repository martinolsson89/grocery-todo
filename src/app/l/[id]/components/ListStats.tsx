"use client";

import { useMemo } from "react";
import type { BoardState, StoreKey } from "../types";

interface ListStatsProps {
  board: BoardState;
  store: StoreKey;
}

export function ListStats({ board, store }: ListStatsProps) {
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
    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
      <span>{total} varor</span>
      <span className="mx-2">•</span>
      <span>{checked} avprickade</span>
      <span className="inline-flex items-center rounded-md ml-2 bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 inset-ring inset-ring-blue-400/30">
        {store == "willys" ? "Willys" : "Hemköp"}
      </span>
      </div>
  );
}
