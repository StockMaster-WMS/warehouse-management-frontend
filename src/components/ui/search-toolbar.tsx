 "use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type SearchToolbarProps = {
  placeholder: string;
  value?: string;
  onValueChange?: (value: string) => void;
  filters?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  noContainer?: boolean;
};

export function SearchToolbar({
  placeholder,
  value,
  onValueChange,
  filters,
  right,
  className,
  noContainer = false,
}: SearchToolbarProps) {
  return (
    <div
      className={cn(
        !noContainer && "ui-surface p-3 transition-all sm:p-4",
        noContainer && "p-3 sm:p-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-primary" />
          <Input
            placeholder={placeholder}
            className="h-10 w-full rounded-lg border-border bg-muted/45 pl-11 pr-4 text-xs font-medium transition-all hover:bg-muted/70 focus-visible:bg-card sm:h-11 sm:text-sm"
            {...(onValueChange
              ? {
                  value: value ?? "",
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    onValueChange(e.target.value),
                }
              : {})}
          />
        </div>

        {right && (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {right}
          </div>
        )}
      </div>

      {filters && (
        <div className="empty:hidden">
          <div className="my-3 h-px w-full bg-border sm:my-4" />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {filters}
          </div>
        </div>
      )}
    </div>
  );
}
