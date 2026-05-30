import { cn } from "@/lib/utils";

type DetailSummaryGridProps = {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
};

export function DetailSummaryGrid({
  children,
  columns = 4,
  className,
}: DetailSummaryGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

type DetailSummaryItemProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  helper?: React.ReactNode;
  mono?: boolean;
  className?: string;
  surface?: boolean;
};

export function DetailSummaryItem({
  label,
  value,
  icon,
  helper,
  mono,
  className,
  surface = true,
}: DetailSummaryItemProps) {
  return (
    <div className={cn(surface ? "ui-surface p-4" : "p-3", className)}>
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="ui-icon-tile size-9 text-primary">{icon}</span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="ui-label">{label}</p>
          <div
            className={cn(
              "mt-1 break-words text-base font-semibold text-foreground",
              mono && "font-mono text-sm",
            )}
          >
            {value || "—"}
          </div>
          {helper ? (
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {helper}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
