import type { LucideIcon } from "lucide-react";

export interface StatItem {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: string;
}

interface StatsGridProps {
    stats: StatItem[];
    cols?: 2 | 3 | 4;
}

export function StatsGrid({ stats, cols = 4 }: StatsGridProps) {
    const colClass = {
        2: "grid-cols-2",
        3: "grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-2 lg:grid-cols-4",
    }[cols];

    return (
        <div className={`grid gap-4 ${colClass}`}>
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {stat.label}
                        </span>
                        {stat.icon && (
                            <stat.icon className={`h-4 w-4 opacity-70 ${stat.color ?? "text-slate-400"}`} />
                        )}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {stat.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
