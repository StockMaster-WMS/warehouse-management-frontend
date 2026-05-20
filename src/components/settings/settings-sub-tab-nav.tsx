"use client";

import React from "react";

import { cn } from "@/lib/utils";

export interface SubTab<T extends string = string> {
  key: T;
  label: string;
}

interface SettingsSubTabNavProps<T extends string> {
  tabs: readonly SubTab<T>[];
  activeTab: T;
  onTabChange: (tabKey: T) => void;
}

export function SettingsSubTabNav<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: SettingsSubTabNavProps<T>) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-1 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "min-h-9 flex-1 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none",
            activeTab === tab.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
