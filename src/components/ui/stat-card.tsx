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
        "ui-surface group relative overflow-hidden p-4 transition-all hover:shadow-md sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="space-y-1">
          <p className="ui-label text-xs sm:text-[11px]">
            {label}
          </p>
          <div className="flex flex-col gap-1">
            <p className="text-xl font-black tabular-nums text-foreground sm:text-2xl">
              {value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "text-[10px] font-bold",
                  isTrend
                    ? (positiveTrend ? "text-success" : "text-destructive")
                    : "text-muted-foreground"
                )}
              >
                {trend}
              </span>
            ) : null}
            {description ? (
              <p className="line-clamp-1 text-[10px] font-medium text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {Icon ? (
          <div className="ui-icon-tile p-2 group-hover:bg-primary/10 group-hover:text-primary">
            <Icon className={cn("size-5", iconClassName)} aria-hidden="true" />
          </div>
        ) : null}
      </div>
      {showAccentBar && (
        <div
          className={cn(
            "absolute bottom-0 left-0 h-1 w-full translate-y-full transition-transform group-hover:translate-y-0",
            accentClassName ?? "bg-primary",
          )}
        />
      )}
    </div>
  );
}
