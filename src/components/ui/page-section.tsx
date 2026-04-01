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
        "rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(contentClassName)}>{children}</div>
    </section>
  );
}
