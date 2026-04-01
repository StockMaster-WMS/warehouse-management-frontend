"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
    <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm dark:border-slate-700 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20 cursor-pointer">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-indigo-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {label}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
