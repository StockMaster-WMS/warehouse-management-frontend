import type { SettingsTab, SettingsTabItem } from "@/components/features/settings/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  tabs: SettingsTabItem[];
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsSidebar({ tabs, activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <Card className="overflow-hidden border-border shadow-sm">
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
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === item.key
                    ? "border-l-4 border-primary bg-primary/5 text-primary"
                    : "border-l-4 border-transparent text-foreground hover:bg-muted",
                )}
              >
                <item.icon className="size-5 flex-shrink-0" />
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
