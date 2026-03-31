"use client";

import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className={["flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end", className].filter(Boolean).join(" ")}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 rounded-xl border-slate-200"
        onClick={onToggle}
        aria-expanded={open}
      >
        <Filter className="mr-2 h-4 w-4 text-indigo-500" />
        Bộ lọc nâng cao
        {activeCount > 0 ? (
          <span className="ml-2 rounded-full bg-indigo-600/10 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
            {activeCount}
          </span>
        ) : null}
        {open ? (
          <ChevronUp className="ml-2 h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4 text-slate-500" />
        )}
      </Button>

      {hasAnyFilter ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-xl px-4 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          onClick={onClear}
        >
          <X className="mr-2 h-4 w-4" />
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
    <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex w-full flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

