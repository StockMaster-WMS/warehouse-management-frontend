import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: string;
  accentClassName?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accentClassName,
  className,
}: StatCardProps) {
  const positiveTrend = trend?.startsWith("+");

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "text-[10px] font-bold",
                  positiveTrend ? "text-emerald-500" : "text-rose-500",
                )}
              >
                {trend}
              </span>
            ) : null}
          </div>
        </div>
        {Icon ? (
          <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        ) : null}
      </div>
      <div
        className={cn(
          "absolute bottom-0 left-0 h-1 w-full translate-y-full transition-transform group-hover:translate-y-0",
          accentClassName ?? "bg-indigo-600",
        )}
      />
    </div>
  );
}
