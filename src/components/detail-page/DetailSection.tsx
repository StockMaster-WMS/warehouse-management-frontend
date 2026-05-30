import { cn } from "@/lib/utils";
import { createElement, isValidElement } from "react";

type DetailIcon = React.ReactNode | React.ElementType<{ className?: string }>;

type DetailSectionProps = {
  /** Optional icon element (usually a lucide icon) */
  icon?: DetailIcon;
  /** Section title */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional trailing element in the header (e.g. badge, button) */
  headerAction?: React.ReactNode;
  /** Content of the section */
  children: React.ReactNode;
  /** Whether the section should have inner padding (default: true) */
  padded?: boolean;
  /** Extra className for the outer container */
  className?: string;
  /** Render without the standard card surface */
  surface?: boolean;
};

function renderIcon(icon: DetailIcon) {
  if (isValidElement(icon)) {
    return icon;
  }

  if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "render" in icon)) {
    return createElement(icon as React.ElementType<{ className?: string }>, { className: "size-4" });
  }

  return null;
}

export function DetailSection({
  icon,
  title,
  description,
  headerAction,
  children,
  padded = true,
  className,
  surface = true,
}: DetailSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden",
        surface && "ui-surface",
        className,
      )}
    >
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-border bg-muted/35 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span className="ui-icon-tile size-8 text-primary">
              {renderIcon(icon)}
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="ui-label text-foreground">
              {title}
            </h3>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {headerAction ? (
          <div className="shrink-0">{headerAction}</div>
        ) : null}
      </div>

      {/* Content */}
      <div className={cn(padded && "p-4 sm:p-5")}>{children}</div>
    </section>
  );
}
