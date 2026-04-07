import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: string;
  description?: string;
  accentClassName?: string;
  iconClassName?: string;
  showAccentBar?: boolean;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  accentClassName,
  iconClassName,
  showAccentBar = true,
  className,
}: StatCardProps) {
  const isTrend = trend && (trend.startsWith("+") || trend.startsWith("-"));
  const positiveTrend = trend?.startsWith("+");

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="space-y-1">
          <p className="text-xs sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="flex flex-col gap-1">
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "text-[10px] font-bold",
                  isTrend 
                    ? (positiveTrend ? "text-emerald-500" : "text-rose-500")
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                {trend}
              </span>
            ) : null}
            {description ? (
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {Icon ? (
          <div className={cn("rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20")}>
            <Icon className={cn("h-5 w-5 text-slate-400 transition-colors group-hover:text-indigo-600", iconClassName)} aria-hidden="true" />
          </div>
        ) : null}
      </div>
      {showAccentBar && (
        <div
          className={cn(
            "absolute bottom-0 left-0 h-1 w-full translate-y-full transition-transform group-hover:translate-y-0",
            accentClassName ?? "bg-indigo-600",
          )}
        />
      )}
    </div>
  );
}
