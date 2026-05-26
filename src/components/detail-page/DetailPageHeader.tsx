import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DetailPageHeaderProps = {
  title: string;
  eyebrow?: string;
  code?: string | null;
  description?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

export function DetailPageHeader({
  title,
  eyebrow,
  code,
  description,
  status,
  actions,
  backHref,
  backLabel = "Quay lại",
  className,
  children,
}: DetailPageHeaderProps) {
  return (
    <header className={cn("ui-surface overflow-hidden", className)}>
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          {backHref ? (
            <Button
              render={<Link href={backHref} />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="-ml-2 h-8 w-fit gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              {backLabel}
            </Button>
          ) : null}

          <div className="min-w-0 space-y-1.5">
            {eyebrow ? <p className="ui-label text-primary">{eyebrow}</p> : null}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
              {code ? (
                <span className="inline-flex max-w-full items-center rounded-md border border-border bg-muted/60 px-2 py-1 font-mono text-xs font-semibold text-muted-foreground">
                  <span className="truncate">{code}</span>
                </span>
              ) : null}
              {status ? <div className="shrink-0">{status}</div> : null}
            </div>
            {description ? (
              <div className="max-w-4xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </div>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
      {children ? <div className="border-t border-border p-4 sm:p-5">{children}</div> : null}
    </header>
  );
}
