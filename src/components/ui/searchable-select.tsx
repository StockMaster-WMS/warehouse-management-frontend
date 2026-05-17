"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SearchableSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type SearchableSelectProps = {
  id?: string;
  value: string;
  onValueChange: (v: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  dialogTitle: string;
  /** Parent filters options (e.g. API). Search box calls onSearchChange instead of local filter. */
  serverSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  className?: string;
};

function SearchableSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Chọn…",
  searchPlaceholder = "Gõ để tìm…",
  emptyText = "Không có mục phù hợp",
  disabled,
  loading,
  error,
  icon,
  dialogTitle,
  serverSearch,
  searchQuery: searchQueryProp,
  onSearchChange,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [localQuery, setLocalQuery] = React.useState("");
  const wasOpenRef = React.useRef(false);

  const searchQuery = serverSearch ? (searchQueryProp ?? "") : localQuery;

  React.useEffect(() => {
    if (wasOpenRef.current && !open) {
      setLocalQuery("");
      if (serverSearch) onSearchChange?.("");
    }
    wasOpenRef.current = open;
  }, [open, serverSearch, onSearchChange]);

  const filtered = React.useMemo(() => {
    if (serverSearch) return options;
    const q = localQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.hint ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, localQuery, serverSearch]);

  const selected = options.find((o) => o.value === value);

  function handleSelect(next: string) {
    onValueChange(next);
    setOpen(false);
  }

  return (
    <>
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "h-10 w-full justify-between border-slate-200 bg-slate-50/50 px-3 font-normal text-left hover:bg-slate-100/80 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:bg-slate-900",
          !selected && "text-muted-foreground",
          error && "border-destructive ring-1 ring-destructive/30",
          className
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {icon ? <span className="shrink-0 text-slate-500">{icon}</span> : null}
          <span className="truncate">
            {loading ? "Đang tải…" : selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[min(85dvh,32rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
          showCloseButton
        >
          <DialogHeader className="border-b border-border px-4 py-3 text-left">
            <DialogTitle className="text-base">{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  if (serverSearch) onSearchChange?.(v);
                  else setLocalQuery(v);
                }}
                placeholder={searchPlaceholder}
                className="border-slate-200 pl-9 dark:border-slate-700"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Đang tải…</p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              <ul className="space-y-0.5" role="listbox">
                {filtered.map((o) => {
                  const isSel = o.value === value;
                  return (
                    <li key={o.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        onClick={() => handleSelect(o.value)}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                          isSel && "bg-primary/10 text-primary"
                        )}
                      >
                        <span className="mt-0.5 shrink-0">
                          {isSel ? (
                            <Check className="size-4 text-primary" />
                          ) : (
                            <span className="inline-block size-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium leading-snug">{o.label}</span>
                          {o.hint ? (
                            <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                              {o.hint}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { SearchableSelect };
