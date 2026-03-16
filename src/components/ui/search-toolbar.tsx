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
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden",
        className
      )}
    >
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={placeholder}
              className="h-9 pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
              {...(onValueChange
                ? {
                    value: value ?? "",
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      onValueChange(e.target.value),
                  }
                : {})}
            />
          </div>
          {filters ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center mt-2 md:mt-0">
              {filters}
            </div>
          ) : null}
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
      </div>
    </div>
  );
}

