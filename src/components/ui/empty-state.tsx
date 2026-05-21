import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center sm:p-8",
        className,
      )}
    >
      <div className="ui-icon-tile mb-3 size-14 sm:mb-4 sm:h-16 sm:w-16">
        <Icon className="size-7 sm:h-8 sm:w-8" aria-hidden="true" />
      </div>
      <h3 className="px-2 text-base font-semibold text-foreground sm:text-lg">
        {title}
      </h3>
      <p className="mt-1 max-w-md px-2 text-xs font-medium text-muted-foreground sm:text-sm">
        {description}
      </p>
      {action ? <div className="mt-3 sm:mt-4">{action}</div> : null}
    </div>
  );
}
