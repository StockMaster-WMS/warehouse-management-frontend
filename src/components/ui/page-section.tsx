import { cn } from "@/lib/utils";

type PageSectionProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PageSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "ui-surface p-4 sm:p-5 md:p-6",
        className,
      )}
    >
      <div className="mb-3 flex flex-col flex-wrap items-start justify-between gap-3 sm:mb-4 sm:flex-row sm:gap-4">
        <div className="min-w-0">
          <h3 className="ui-label text-xs text-foreground sm:text-sm">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(contentClassName)}>{children}</div>
    </section>
  );
}
