import { cn } from "@/lib/utils";

type DetailPageLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Standard container for detail pages.
 * Standardizes: vertical spacing, bottom padding, max-width.
 */
export function DetailPageLayout({
  children,
  className,
}: DetailPageLayoutProps) {
  return (
    <div className={cn("mx-auto w-full max-w-8xl space-y-5 pb-16 sm:space-y-6", className)}>
      {children}
    </div>
  );
}
