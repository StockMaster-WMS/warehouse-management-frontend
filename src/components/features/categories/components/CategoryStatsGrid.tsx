import { FolderTree, Package, Tag } from "lucide-react";

interface StatCard {
  label: string;
  value: string;
}

interface CategoryStatsGridProps {
  stats: StatCard[];
}

const STAT_ICONS: Record<string, { icon: typeof FolderTree; color: string }> = {
  "Tổng nhóm hàng": { icon: FolderTree, color: "text-indigo-500" },
  "Nhóm cấp gốc": { icon: Tag, color: "text-emerald-500" },
  "Nhóm con": { icon: Tag, color: "text-slate-400" },
  "Đang hiển thị": { icon: Package, color: "text-blue-500" },
};

export function CategoryStatsGrid({ stats }: CategoryStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
      {stats.map((stat, index) => {
        const iconConfig = STAT_ICONS[stat.label] ?? {
          icon: FolderTree,
          color: "text-slate-400",
        };
        const IconComponent = iconConfig.icon;

        return (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <IconComponent className={`h-4 w-4 ${iconConfig.color} opacity-70`} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
