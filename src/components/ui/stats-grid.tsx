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
                    <div key={`stat-skeleton-${i}`} className="ui-surface p-5">
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
                const StatElement = stat.onClick ? "button" : "div";
                const content = (
                    <StatElement
                        key={stat.label}
                        type={stat.onClick ? "button" : undefined}
                        className={cn(
                            "ui-surface group relative overflow-hidden p-5 text-left transition-all",
                            stat.onClick && "cursor-pointer hover:border-primary/30 hover:shadow-md",
                            stat.className
                        )}
                        onClick={stat.onClick}
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <span className="ui-label">
                                {stat.label}
                            </span>
                            {stat.icon && (
                                <stat.icon className={cn("size-4 opacity-70 transition-colors", stat.color ?? "text-muted-foreground", stat.onClick && "group-hover:text-primary")} />
                            )}
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {stat.value}
                        </div>
                        {stat.onClick && (
                            <div className="absolute bottom-0 left-0 h-1 w-full translate-y-full bg-primary transition-transform group-hover:translate-y-0" />
                        )}
                    </StatElement>
                );

                return content;
            })}
        </div>
    );
}
