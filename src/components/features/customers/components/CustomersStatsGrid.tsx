import { Users, UserCheck, UserX, List } from "lucide-react";
import { StatsGrid } from "@/components/ui/stats-grid";
import type { StatItem } from "@/components/ui/stats-grid";

type CustomersStatsGridProps = {
    total: number;
    activeOnPage: number;
    inactiveOnPage: number;
    pageLabel: string;
};

export function CustomersStatsGrid({
    total,
    activeOnPage,
    inactiveOnPage,
    pageLabel,
}: CustomersStatsGridProps) {
    const items: StatItem[] = [
        {
            label: "Tổng khách hàng",
            value: String(total),
            icon: Users,
            color: "text-indigo-500",
        },
        {
            label: "Hoạt động (trang này)",
            value: String(activeOnPage),
            icon: UserCheck,
            color: "text-emerald-500",
        },
        {
            label: "Ngừng hoạt động",
            value: String(inactiveOnPage),
            icon: UserX,
            color: "text-rose-500",
        },
        {
            label: "Trang / kích thước",
            value: pageLabel,
            icon: List,
            color: "text-blue-500",
        },
    ];

    return <StatsGrid stats={items} />;
}
