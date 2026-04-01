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
};

export function SearchToolbar({
  placeholder,
  value,
  onValueChange,
  filters,
  right,
  className,
}: SearchToolbarProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all", className)}>
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-indigo-500" />
          <Input
            placeholder={placeholder}
            className="h-10 sm:h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-xs sm:text-sm font-medium transition-all hover:bg-slate-50 focus-visible:border-indigo-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-900"
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
        <>
          <div className="my-3 sm:my-4 h-px w-full bg-slate-100 dark:bg-slate-800" />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {filters}
          </div>
        </>
      )}
    </div>
  );
}

