import { cn } from "@/lib/utils";

/* ─── Color Scheme Types ───────────────────────────────────────────── */

export type StatusColorScheme =
  | "slate"
  | "blue"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "teal";

export type StatusConfig = {
  label: string;
  color: StatusColorScheme;
};

/* ─── Color Map ────────────────────────────────────────────────────── */

const COLOR_MAP: Record<
  StatusColorScheme,
  { bg: string; text: string; dot: string; border: string }
> = {
  slate: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-900",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    text: "text-indigo-700 dark:text-indigo-400",
    dot: "bg-indigo-500",
    border: "border-indigo-200 dark:border-indigo-900",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-900",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-900",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
    border: "border-rose-200 dark:border-rose-900",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
    border: "border-violet-200 dark:border-violet-900",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    text: "text-teal-700 dark:text-teal-400",
    dot: "bg-teal-500",
    border: "border-teal-200 dark:border-teal-900",
  },
};

/* ─── Component ────────────────────────────────────────────────────── */

type DetailStatusBadgeProps = {
  /** Raw status string from API */
  status: string | null | undefined;
  /** Map of status key → { label, color } */
  statusConfig: Record<string, StatusConfig>;
  /** Fallback label when status is not found in statusConfig */
  fallback?: string;
  /** Show animated dot */
  showDot?: boolean;
  /** Extra className */
  className?: string;
};

export function DetailStatusBadge({
  status,
  statusConfig,
  fallback,
  showDot = true,
  className,
}: DetailStatusBadgeProps) {
  const cfg = statusConfig[status ?? ""];

  if (!cfg) {
    return (
      <span className="text-xs text-muted-foreground">
        {status ?? fallback ?? "—"}
      </span>
    );
  }

  const colors = COLOR_MAP[cfg.color] ?? COLOR_MAP.slate;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      {showDot ? (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", colors.dot)}
          aria-hidden
        />
      ) : null}
      {cfg.label}
    </span>
  );
}
