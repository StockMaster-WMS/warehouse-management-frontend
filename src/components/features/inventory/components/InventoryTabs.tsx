import { cn } from "@/lib/utils";
import type { InventoryTab } from "@/components/features/inventory/hooks/useInventoryPageLogic";

type InventoryTabsProps = {
  activeTab: InventoryTab;
  onTabChange: (tab: InventoryTab) => void;
};

const TABS: { value: InventoryTab; label: string }[] = [
  { value: "stock", label: "Tồn kho" },
  { value: "low-stock", label: "Tồn kho thấp" },
  { value: "near-expiry", label: "Sắp hết hạn" },
];

export function InventoryTabs({ activeTab, onTabChange }: InventoryTabsProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/50">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === tab.value
              ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
          )}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
