import { Building2, CheckCircle2, Package, XCircle } from "lucide-react";
import { StatsGrid } from "@/components/ui/stats-grid";
import type { StatItem } from "@/components/ui/stats-grid";
import type { WarehouseSummary } from "@/types/warehouse";

type WarehouseStatsGridProps = {
  summary: WarehouseSummary | null | undefined;
  isLoading: boolean;
};

export function WarehouseStatsGrid({ summary, isLoading }: WarehouseStatsGridProps) {
  const stats: StatItem[] = summary ? [
    { 
      label: "Tổng số kho", 
      value: summary.totalWarehouses, 
      icon: Building2, 
      color: "text-indigo-500" 
    },
    { 
      label: "Đang hoạt động", 
      value: summary.activeWarehouses, 
      icon: CheckCircle2, 
      color: "text-emerald-500" 
    },
    { 
      label: "Ngừng hoạt động", 
      value: summary.inactiveWarehouses, 
      icon: XCircle, 
      color: "text-rose-500" 
    },
    { 
      label: "Có tồn kho", 
      value: summary.warehousesWithStock, 
      icon: Package, 
      color: "text-amber-500" 
    },
  ] : [];

  return (
    <StatsGrid 
      stats={stats} 
      cols={4} 
      isLoading={isLoading || !summary} 
    />
  );
}
