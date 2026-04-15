import { Building2, List, CalendarClock, PackageCheck } from "lucide-react";
import { StatsGrid } from "@/components/ui/stats-grid";
import type { StatItem } from "@/components/ui/stats-grid";

type SuppliersStatsGridProps = {
    totalPartners: number;
    activeCount: number;
    inactiveCount: number;
    multiPage: boolean;
    pageDisplay: string;
};

export function SuppliersStatsGrid({
    totalPartners,
    activeCount,
    inactiveCount,
    multiPage,
    pageDisplay,
}: SuppliersStatsGridProps) {
    const stats: StatItem[] = [
        { label: "Tổng đối tác",                                          value: totalPartners, icon: Building2,    color: "text-indigo-500" },
        { label: multiPage ? "Hoạt động (trang này)" : "Đang hoạt động", value: activeCount,   icon: PackageCheck, color: "text-emerald-500" },
        { label: multiPage ? "Ngưng (trang này)" : "Ngưng hoạt động",    value: inactiveCount, icon: CalendarClock,color: "text-amber-500" },
        { label: "Trang / kích thước",                                    value: pageDisplay,   icon: List,         color: "text-blue-500" },
    ];
    return <StatsGrid stats={stats} />;
}
