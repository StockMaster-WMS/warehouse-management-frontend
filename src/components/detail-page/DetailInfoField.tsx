import { cn } from "@/lib/utils";

type DetailInfoFieldProps = {
  /** Optional icon element (lucide icon) */
  icon?: React.ReactNode;
  /** Field label */
  label: string;
  /** Field value — string or ReactNode */
  value: React.ReactNode;
  /** Use monospace font for value */
  mono?: boolean;
  /** Compact mode — smaller spacing */
  compact?: boolean;
  /** Extra className for the outer wrapper */
  className?: string;
};

export function DetailInfoField({
  icon,
  label,
  value,
  mono,
  compact,
  className,
}: DetailInfoFieldProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3",
        compact ? "py-2" : "py-2.5",
        className,
      )}
    >
      {icon ? (
        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="ui-label">
          {label}
        </p>
        <div
          className={cn(
            "mt-0.5 min-w-0 break-words text-sm text-foreground",
            mono && "font-mono",
            compact ? "font-medium" : "font-semibold",
          )}
        >
          {value || "—"}
        </div>
      </div>
    </div>
  );
}
