"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";

interface ListToolbarProps {
  listId: string;
  stats: React.ReactNode;

  viewMode: "sections" | "flat";
  onViewModeChange: (mode: "sections" | "flat") => void;

  addFormOpen: boolean;
  onToggleAddForm: () => void;

  copied: boolean;
  onCopyLink: () => void;

  onClear: () => void;

  checkFilter: "all" | "checked" | "unchecked";
  onCheckFilterChange: (filter: "all" | "checked" | "unchecked") => void;

  children?: React.ReactNode;
}

export function ListToolbar({
  listId,
  stats,
  viewMode,
  onViewModeChange,
  addFormOpen,
  onToggleAddForm,
  copied,
  onCopyLink,
  onClear,
  checkFilter,
  onCheckFilterChange,
  children,
}: ListToolbarProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pb-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-semibold leading-tight wrap-break-word">
              Inköpslista
              <span className="text-muted-foreground"> ({listId})</span>
            </h1>
            {stats}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button asChild variant="outline" size="sm" className="touch-manipulation">
              <Link href={`/l/${listId}/recipes`}>Recept</Link>
            </Button>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "sections" ? "secondary" : "outline"}
                size="sm"
                className="touch-manipulation"
                onClick={() => onViewModeChange("sections")}
              >
                Sektioner
              </Button>
              <Button
                variant={viewMode === "flat" ? "secondary" : "outline"}
                size="sm"
                className="touch-manipulation"
                onClick={() => onViewModeChange("flat")}
              >
                Lista
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="touch-manipulation"
              aria-expanded={addFormOpen}
              aria-controls="add-item-form"
              onClick={onToggleAddForm}
            >
              {addFormOpen ? "Dölj" : "Lägg till"}
            </Button>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="touch-manipulation"
                onClick={onCopyLink}
              >
                {copied ? "✓" : "📋"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="touch-manipulation"
                onClick={onClear}
              >
                Rensa
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={checkFilter === "all" ? "secondary" : "outline"}
            size="sm"
            className="touch-manipulation"
            onClick={() => onCheckFilterChange("all")}
          >
            Alla
          </Button>
          <Button
            variant={checkFilter === "unchecked" ? "secondary" : "outline"}
            size="sm"
            className="touch-manipulation"
            onClick={() => onCheckFilterChange("unchecked")}
          >
            Ej avprickade
          </Button>
          <Button
            variant={checkFilter === "checked" ? "secondary" : "outline"}
            size="sm"
            className="touch-manipulation"
            onClick={() => onCheckFilterChange("checked")}
          >
            Avprickade
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
}
