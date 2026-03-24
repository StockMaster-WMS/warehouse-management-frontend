import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  className?: string;
  /** Extra classes for the actions row (e.g. w-full justify-end on mobile). */
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
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm font-medium text-slate-500">{description}</p>
      </div>
      {actions ? (
        <div className={cn("flex flex-wrap items-center gap-2", actionsClassName)}>{actions}</div>
      ) : null}
    </div>
  );
}
