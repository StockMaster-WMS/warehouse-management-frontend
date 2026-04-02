import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  className?: string;
  actionsClassName?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  actions,
  actionsClassName,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-0.5 sm:space-y-1 min-w-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white wrap-break-word">
          {title}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 wrap-break-word">{description}</p>
      </div>
      {actions ? (
        <div className={cn("flex flex-wrap items-center gap-2 shrink-0", actionsClassName)}>{actions}</div>
      ) : null}
    </div>
  );
}
