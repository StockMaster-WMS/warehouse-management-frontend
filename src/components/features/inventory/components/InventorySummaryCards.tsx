import {
  Boxes,
  Package,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { StatsGrid } from "@/components/ui/stats-grid";
import type { StatItem } from "@/components/ui/stats-grid";
import type { StockSummaryResponse } from "@/types/stock";
import type { InventoryTab } from "@/components/features/inventory/hooks/useInventoryPageLogic";

type InventorySummaryCardsProps = {
  summary: StockSummaryResponse | null | undefined;
  isLoading: boolean;
  onTabChange?: (tab: InventoryTab) => void;
};

export function InventorySummaryCards({
  summary,
  isLoading,
  onTabChange,
}: InventorySummaryCardsProps) {
  const stats: StatItem[] = summary ? [
    { label: "Tổng mã hàng", value: summary.totalSkus.toLocaleString("vi-VN"),        icon: Boxes,        color: "text-blue-500" },
    { label: "Tồn tay",      value: summary.totalQtyOnHand.toLocaleString("vi-VN"),   icon: Package,      color: "text-slate-500" },
    { label: "Đang giữ chỗ", value: summary.totalQtyReserved.toLocaleString("vi-VN"), icon: Lock,         color: "text-amber-500" },
    { label: "Khả dụng",     value: summary.totalQtyAvailable.toLocaleString("vi-VN"),icon: CheckCircle2, color: "text-emerald-500" },
    { 
      label: "Tồn kho thấp", 
      value: summary.lowStockCount.toLocaleString("vi-VN"), 
      icon: AlertTriangle, 
      color: "text-amber-500",
      onClick: () => onTabChange?.("low-stock")
    },
    { 
      label: "Sắp hết hạn", 
      value: summary.nearExpiryCount.toLocaleString("vi-VN"), 
      icon: Clock, 
      color: "text-rose-500",
      onClick: () => onTabChange?.("near-expiry")
    },
  ] : [];

  return (
    <StatsGrid 
      stats={stats} 
      cols={6} 
      isLoading={isLoading || !summary} 
    />
  );
}
