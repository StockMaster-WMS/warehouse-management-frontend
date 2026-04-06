import type { SettingsTab, SettingsTabItem } from "@/components/features/settings/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SettingsSidebarProps {
  tabs: SettingsTabItem[];
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsSidebar({ tabs, activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">Danh mục</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {tabs.map((item, index) => (
            <div key={item.key}>
              <button
                type="button"
                onClick={() => onTabChange(item.key)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                  activeTab === item.key
                    ? "border-l-4 border-indigo-600 bg-indigo-50/80 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "border-l-4 border-transparent text-slate-700 hover:bg-slate-50/80 dark:text-slate-300 dark:hover:bg-slate-800/50"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
              {index < tabs.length - 1 && <Separator className="my-0" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
