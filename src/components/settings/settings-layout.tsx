"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const settingsSelectClassName =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface SettingsSectionProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

interface SettingsPanelProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SettingsPanel({
  icon: Icon,
  title,
  description,
  children,
  className,
  contentClassName,
}: SettingsPanelProps) {
  return (
    <Card className={cn("border-border shadow-sm", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("space-y-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

interface SettingsFieldProps {
  icon?: LucideIcon;
  label: string;
  htmlFor?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsField({
  icon: Icon,
  label,
  htmlFor,
  description,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
        {label}
      </label>
      {children}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

interface SettingsOptionButtonProps {
  selected?: boolean;
  icon?: LucideIcon;
  title: string;
  description?: string;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

export function SettingsOptionButton({
  selected = false,
  icon: Icon,
  title,
  description,
  onClick,
  children,
  className,
}: SettingsOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-colors",
        selected
          ? "border-primary/40 bg-primary/5 text-foreground ring-1 ring-primary/10"
          : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <Icon
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              selected ? "text-primary" : "text-muted-foreground",
            )}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </button>
  );
}
