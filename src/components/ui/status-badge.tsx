import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground dark:bg-muted/60",
        info: "border-info/20 bg-info-soft text-info-foreground",
        success: "border-success/20 bg-success-soft text-success-foreground",
        warning: "border-warning/20 bg-warning-soft text-warning-foreground",
        danger: "border-destructive/20 bg-danger-soft text-destructive",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type StatusBadgeProps = React.ComponentProps<typeof Badge> &
  VariantProps<typeof statusBadgeVariants> & {
    dot?: boolean;
  };

export function StatusBadge({
  tone = "neutral",
  dot = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusBadgeVariants({ tone }), className)}
      {...props}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </Badge>
  );
}

export { statusBadgeVariants };
