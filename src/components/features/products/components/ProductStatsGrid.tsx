import { Hash, ListOrdered, MapPin, Package } from "lucide-react";

interface StatCard {
    label: string;
    value: string;
}

interface ProductStatsGridProps {
    stats: StatCard[];
}

const STAT_ICONS: Record<string, { icon: typeof Hash; color: string }> = {
    "Tổng SKU": { icon: Hash, color: "text-blue-500" },
    "Trang (hiện tại / tổng)": { icon: ListOrdered, color: "text-indigo-500" },
    "Vị trí lưu trữ": { icon: MapPin, color: "text-emerald-500" },
    "Giá trị hàng": { icon: Package, color: "text-slate-400" },
};

export function ProductStatsGrid({ stats }: ProductStatsGridProps) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {stats.map((stat, i) => {
                const iconConfig = STAT_ICONS[stat.label] || {
                    icon: Package,
                    color: "text-slate-400",
                };
                const IconComponent = iconConfig.icon;

                return (
                    <div
                        key={i}
                        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                {stat.label}
                            </span>
                            <IconComponent
                                className={`h-4 w-4 ${iconConfig.color} opacity-70`}
                            />
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
