import { CheckCircle2, CircleOff, Filter, MapPin } from "lucide-react";
import { StatsGrid } from "@/components/ui/stats-grid";
import type { StatItem } from "@/components/ui/stats-grid";

type LocationsStatsProps = {
    totalLocations: number;
    activeLocations: number;
    inactiveLocations: number;
    filteredCount: number;
};

export function LocationsStats({
    totalLocations,
    activeLocations,
    inactiveLocations,
    filteredCount,
}: LocationsStatsProps) {
    const stats: StatItem[] = [
        { label: "Tổng vị trí",      value: totalLocations,   icon: MapPin,        color: "text-indigo-500" },
        { label: "Đang hoạt động",   value: activeLocations,  icon: CheckCircle2,  color: "text-emerald-500" },
        { label: "Ngừng dùng",       value: inactiveLocations, icon: CircleOff,    color: "text-rose-500" },
        { label: "Kết quả lọc",      value: filteredCount,    icon: Filter,        color: "text-blue-500" },
    ];
    return <StatsGrid stats={stats} />;
}
