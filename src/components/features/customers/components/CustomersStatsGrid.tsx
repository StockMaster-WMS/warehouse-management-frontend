import { Users, UserPlus, Star, RefreshCw } from "lucide-react";
import { StatsGrid } from "@/components/ui/stats-grid";
import type { StatItem } from "@/components/ui/stats-grid";
import { buildCustomerStats } from "@/components/features/customers/utils";

const ICONS: Record<string, { icon: typeof Users; color: string }> = {
    "Tổng khách hàng":     { icon: Users,     color: "text-indigo-500" },
    "Khách mới tháng này": { icon: UserPlus,  color: "text-emerald-500" },
    "Khách hàng VIP":      { icon: Star,      color: "text-amber-500" },
    "Tỷ lệ quay lại":     { icon: RefreshCw, color: "text-blue-500" },
};

export function CustomersStatsGrid() {
    const items: StatItem[] = buildCustomerStats().map((s) => {
        const cfg = ICONS[s.label] ?? { icon: Users, color: "text-slate-400" };
        return { label: s.label, value: s.value, icon: cfg.icon, color: cfg.color };
    });
    return <StatsGrid stats={items} />;
}
