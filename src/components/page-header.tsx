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
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="wrap-break-word text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl md:text-3xl">
          {title}
        </h1>
        <p className="wrap-break-word max-w-3xl text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
      </div>
      {actions ? (
        <div className={cn("flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0", actionsClassName)}>{actions}</div>
      ) : null}
    </div>
  );
}
