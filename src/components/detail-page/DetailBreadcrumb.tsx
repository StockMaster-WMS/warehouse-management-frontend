import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type DetailBreadcrumbProps = {
  /** URL to navigate back to, e.g. "/suppliers" */
  backHref: string;
  /** Label for the back list, e.g. "Nhà cung cấp" */
  backLabel: string;
  /** The entity code / number shown after the chevron, e.g. "PO-20250101" */
  currentLabel?: string;
};

export function DetailBreadcrumb({
  backHref,
  backLabel,
  currentLabel,
}: DetailBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <Button
        render={<Link href={backHref} />}
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Button>

      {currentLabel ? (
        <>
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          <span className="truncate font-mono text-xs font-semibold text-foreground">
            {currentLabel}
          </span>
        </>
      ) : null}
    </nav>
  );
}
