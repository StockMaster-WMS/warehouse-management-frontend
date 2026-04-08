import { FolderTree, Package, Tag } from "lucide-react";
import { StatsGrid } from "@/components/ui/stats-grid";
import type { StatItem } from "@/components/ui/stats-grid";

interface StatCard {
    label: string;
    value: string;
}

interface CategoryStatsGridProps {
    stats: StatCard[];
}

const STAT_ICONS: Record<string, { icon: typeof FolderTree; color: string }> = {
    "Tổng nhóm hàng": { icon: FolderTree, color: "text-indigo-500" },
    "Nhóm cấp gốc":   { icon: Tag,        color: "text-emerald-500" },
    "Nhóm con":        { icon: Tag,        color: "text-slate-400" },
    "Đang hiển thị":  { icon: Package,    color: "text-blue-500" },
};

export function CategoryStatsGrid({ stats }: CategoryStatsGridProps) {
    const items: StatItem[] = stats.map((s) => {
        const cfg = STAT_ICONS[s.label] ?? { icon: FolderTree, color: "text-slate-400" };
        return { label: s.label, value: s.value, icon: cfg.icon, color: cfg.color };
    });
    return <StatsGrid stats={items} />;
}
