"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ToggleOptionRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ToggleOptionRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleOptionRowProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors",
        "hover:border-primary/30 hover:bg-muted/40",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {label}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
