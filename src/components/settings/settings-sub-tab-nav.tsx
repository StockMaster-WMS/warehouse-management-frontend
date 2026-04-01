"use client";

import React from "react";

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
    <div className="flex flex-wrap justify-center gap-x-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-8 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
            activeTab === tab.key
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
