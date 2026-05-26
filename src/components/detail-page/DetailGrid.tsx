import { cn } from "@/lib/utils";

type DetailGridProps = {
  /** The main (left) content — takes 2/3 width on desktop */
  children: React.ReactNode;
  /** Optional sidebar (right) content — takes 1/3 width on desktop */
  sidebar?: React.ReactNode;
  /** Extra className */
  className?: string;
};

/**
 * Standard 2-column grid layout for detail pages.
 * Main content (2/3) + optional sidebar (1/3).
 * Stacks vertically on mobile.
 */
export function DetailGrid({ children, sidebar, className }: DetailGridProps) {
  if (!sidebar) {
    return <div className={cn("space-y-6", className)}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 lg:grid-cols-3",
        className,
      )}
    >
      <div className="space-y-6 lg:col-span-2">{children}</div>
      <div className="space-y-6">{sidebar}</div>
    </div>
  );
}
