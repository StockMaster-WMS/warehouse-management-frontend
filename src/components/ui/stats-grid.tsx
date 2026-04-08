import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StatItem {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: string;
    onClick?: () => void;
    className?: string;
}

interface StatsGridProps {
    stats: StatItem[];
    cols?: 2 | 3 | 4 | 6;
    isLoading?: boolean;
}

export function StatsGrid({ stats, cols = 4, isLoading }: StatsGridProps) {
    const colClass = {
        2: "grid-cols-2",
        3: "grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-2 lg:grid-cols-4",
        6: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    }[cols];

    if (isLoading) {
        return (
            <div className={cn("grid gap-4", colClass)}>
                {Array.from({ length: cols }).map((_, i) => (
                    <div
                        key={`stat-skeleton-${i}`}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <Skeleton className="mb-2 h-3 w-16" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("grid gap-4", colClass)}>
            {stats.map((stat) => {
                const content = (
                    <div
                        key={stat.label}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900",
                            stat.onClick && "cursor-pointer hover:border-indigo-200 hover:shadow-md dark:hover:border-indigo-900",
                            stat.className
                        )}
                        onClick={stat.onClick}
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                {stat.label}
                            </span>
                            {stat.icon && (
                                <stat.icon className={cn("h-4 w-4 opacity-70 transition-colors", stat.color ?? "text-slate-400", stat.onClick && "group-hover:text-indigo-500")} />
                            )}
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {stat.value}
                        </div>
                        {stat.onClick && (
                            <div className="absolute bottom-0 left-0 h-1 w-full translate-y-full bg-indigo-500 transition-transform group-hover:translate-y-0" />
                        )}
                    </div>
                );

                return content;
            })}
        </div>
    );
}
