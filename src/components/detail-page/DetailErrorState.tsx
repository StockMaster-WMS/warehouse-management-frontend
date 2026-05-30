import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type DetailErrorStateProps = {
  /** Error message to display */
  message?: string;
  /** URL to navigate back to */
  backHref: string;
  /** Label for the back button */
  backLabel?: string;
  /** Retry callback */
  onRetry?: () => void;
};

/**
 * Standard error state for detail pages.
 * Shows: error icon + message + retry + back button.
 */
export function DetailErrorState({
  message = "Không tải được dữ liệu hoặc không tìm thấy.",
  backHref,
  backLabel = "Về danh sách",
  onRetry,
}: DetailErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-20 shadow-sm">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30">
        <AlertCircle className="size-7 text-rose-500 dark:text-rose-400" />
      </div>
      <p className="max-w-md text-center text-sm font-medium text-muted-foreground">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        ) : null}
        <Button
          render={<Link href={backHref} />}
          nativeButton={false}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
