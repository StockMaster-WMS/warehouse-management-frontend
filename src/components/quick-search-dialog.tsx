"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  NAV_SEARCH_ITEMS,
  type NavSearchItem,
} from "@/lib/nav-search-items";
import { canAccessPath, getUserRoles } from "@/lib/access-control";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";

type QuickSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function filterItems(query: string, items: NavSearchItem[]): NavSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = `${item.label} ${item.href} ${item.group}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function QuickSearchDialog({
  open,
  onOpenChange,
}: QuickSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <QuickSearchDialogContent onOpenChange={onOpenChange} /> : null}
    </Dialog>
  );
}

function QuickSearchDialogContent({
  onOpenChange,
}: Pick<QuickSearchDialogProps, "onOpenChange">) {
  const { push } = useRouter();
  const { data: user } = useGetCurrentUserQuery();
  const userRoles = useMemo(() => getUserRoles(user?.roles), [user?.roles]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const accessibleItems = useMemo(
    () => NAV_SEARCH_ITEMS.filter((item) => canAccessPath(item.href, userRoles)),
    [userRoles],
  );
  const filtered = useMemo(() => filterItems(query, accessibleItems), [accessibleItems, query]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!activeItemRef.current) return;
    activeItemRef.current.scrollIntoView({ block: "nearest" });
  }, [activeIndex, filtered.length]);

  const navigateTo = useCallback(
    (href: string) => {
      onOpenChange(false);
      push(href);
    },
    [onOpenChange, push],
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) navigateTo(item.href);
    }
  };

  return (
    <DialogContent
      className="max-h-[min(70vh,32rem)] gap-0 overflow-hidden p-0 sm:max-w-lg"
      showCloseButton
    >
        <DialogTitle className="sr-only">Tìm kiếm và điều hướng nhanh</DialogTitle>
        <DialogDescription className="sr-only">
          Gõ để lọc danh sách trang. Dùng phím mũi tên và Enter để mở trang.
        </DialogDescription>

        <div
          className="flex max-h-[min(70vh,32rem)] flex-col outline-none"
          role="combobox"
          tabIndex={-1}
          aria-controls="quick-search-listbox"
          aria-expanded="true"
          aria-haspopup="listbox"
          onKeyDown={handleContainerKeyDown}
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Gõ tên trang hoặc đường dẫn…"
                className="h-11 border-0 bg-transparent pl-10 pr-3 text-base shadow-none focus-visible:ring-0"
                autoComplete="off"
                aria-controls="quick-search-listbox"
                aria-autocomplete="list"
              />
            </div>
          </div>

          <div
            id="quick-search-listbox"
            role="listbox"
            className="max-h-[min(50vh,22rem)] overflow-y-auto overscroll-contain p-2"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Không có mục phù hợp. Thử từ khóa khác.
              </p>
            ) : (
              filtered.map((item, idx) => {
                const prevGroup = idx > 0 ? filtered[idx - 1].group : null;
                const showGroup = item.group !== prevGroup;
                return (
                  <div key={item.id}>
                    {showGroup ? (
                      <div
                        className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground first:pt-0"
                        role="presentation"
                      >
                        {item.group}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      id={`quick-search-opt-${item.id}`}
                      ref={idx === activeIndex ? activeItemRef : null}
                      role="option"
                      aria-selected={idx === activeIndex}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors outline-none",
                        idx === activeIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/80",
                      )}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => navigateTo(item.href)}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          idx === activeIndex
                            ? "text-accent-foreground/80"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.href}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">
              <kbd className="rounded border bg-background px-1 font-mono">↑</kbd>{" "}
              <kbd className="rounded border bg-background px-1 font-mono">↓</kbd>{" "}
              chọn ·{" "}
              <kbd className="rounded border bg-background px-1 font-mono">
                Enter
              </kbd>{" "}
              mở trang ·{" "}
              <kbd className="rounded border bg-background px-1 font-mono">
                Esc
              </kbd>{" "}
              đóng
            </span>
            <span className="sm:hidden">Chạm mục để mở trang</span>
          </div>
        </div>
    </DialogContent>
  );
}
