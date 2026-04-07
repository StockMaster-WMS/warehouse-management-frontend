import {
  Boxes,
  Package,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockSummaryResponse } from "@/types/stock";
import type { InventoryTab } from "@/components/features/inventory/hooks/useInventoryPageLogic";

type InventorySummaryCardsProps = {
  summary: StockSummaryResponse | null;
  isLoading: boolean;
  onTabChange?: (tab: InventoryTab) => void;
};

export function InventorySummaryCards({
  summary,
  isLoading,
  onTabChange,
}: InventorySummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`sum-sk-${i}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Tổng SKU" value={summary.totalSkus.toLocaleString("vi-VN")} icon={Boxes} />
      <StatCard label="Tồn tay" value={summary.totalQtyOnHand.toLocaleString("vi-VN")} icon={Package} />
      <StatCard
        label="Đang giữ chỗ"
        value={summary.totalQtyReserved.toLocaleString("vi-VN")}
        icon={Lock}
        className="ring-1 ring-amber-200/50"
      />
      <StatCard
        label="Khả dụng"
        value={summary.totalQtyAvailable.toLocaleString("vi-VN")}
        icon={CheckCircle2}
        accentClassName="bg-emerald-600"
      />
      <button
        type="button"
        className="text-left"
        title="Xem tồn kho thấp"
        onClick={() => onTabChange?.("low-stock")}
      >
        <StatCard
          label="Tồn kho thấp"
          value={summary.lowStockCount.toLocaleString("vi-VN")}
          icon={AlertTriangle}
          accentClassName="bg-amber-500"
          className="cursor-pointer ring-1 ring-amber-200/50 transition-shadow hover:ring-2 hover:ring-amber-300"
        />
      </button>
      <button
        type="button"
        className="text-left"
        title="Xem hàng sắp hết hạn"
        onClick={() => onTabChange?.("near-expiry")}
      >
        <StatCard
          label="Sắp hết hạn"
          value={summary.nearExpiryCount.toLocaleString("vi-VN")}
          icon={Clock}
          accentClassName="bg-rose-600"
          className="cursor-pointer ring-1 ring-rose-200/50 transition-shadow hover:ring-2 hover:ring-rose-300"
        />
      </button>
    </div>
  );
}
