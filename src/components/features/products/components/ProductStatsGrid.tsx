import { Hash, ListOrdered, MapPin, Package } from "lucide-react";
import { StatsGrid } from "@/components/ui/stats-grid";
import type { StatItem } from "@/components/ui/stats-grid";

interface StatCard {
    label: string;
    value: string;
}

interface ProductStatsGridProps {
    stats: StatCard[];
}

const STAT_ICONS: Record<string, { icon: typeof Hash; color: string }> = {
    "Tổng SKU":                     { icon: Hash,        color: "text-blue-500" },
    "Trang (hiện tại / tổng)":      { icon: ListOrdered, color: "text-indigo-500" },
    "Vị trí lưu trữ":               { icon: MapPin,      color: "text-emerald-500" },
    "Giá trị hàng":                  { icon: Package,     color: "text-slate-400" },
};

export function ProductStatsGrid({ stats }: ProductStatsGridProps) {
    const items: StatItem[] = stats.map((s) => {
        const cfg = STAT_ICONS[s.label] ?? { icon: Package, color: "text-slate-400" };
        return { label: s.label, value: s.value, icon: cfg.icon, color: cfg.color };
    });
    return <StatsGrid stats={items} />;
}
