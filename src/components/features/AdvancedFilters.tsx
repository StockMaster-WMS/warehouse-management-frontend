"use client";

import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdvancedFilterActionsProps = {
  open: boolean;
  onToggle: () => void;
  activeCount?: number;
  hasAnyFilter: boolean;
  onClear: () => void;
  className?: string;
};

export function AdvancedFilterActions({
  open,
  onToggle,
  activeCount = 0,
  hasAnyFilter,
  onClear,
  className,
}: AdvancedFilterActionsProps) {
  return (
    <div className={cn("flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:justify-end", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 max-w-full flex-1 rounded-lg sm:flex-none"
        onClick={onToggle}
        aria-expanded={open}
      >
        <Filter className="mr-2 size-4 text-primary" />
        Bộ lọc nâng cao
        {activeCount > 0 ? (
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
            {activeCount}
          </span>
        ) : null}
        {open ? (
          <ChevronUp className="ml-2 size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="ml-2 size-4 text-muted-foreground" />
        )}
      </Button>

      {hasAnyFilter ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-lg px-4 text-muted-foreground hover:bg-danger-soft hover:text-destructive"
          onClick={onClear}
        >
          <X className="mr-2 size-4" />
          Xoá lọc
        </Button>
      ) : null}
    </div>
  );
}

type AdvancedFilterPanelProps = {
  open: boolean;
  summary?: React.ReactNode;
  children?: React.ReactNode;
};

export function AdvancedFilterPanel({ open, summary, children }: AdvancedFilterPanelProps) {
  if (!open) {
    return summary ? <div className="w-full">{summary}</div> : null;
  }

  return (
    <div className="ui-muted-surface w-full p-3">
      <div className="flex w-full flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
