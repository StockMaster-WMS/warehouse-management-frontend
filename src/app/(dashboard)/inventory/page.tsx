import {
  Boxes,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchToolbar } from "@/components/ui/search-toolbar";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Theo dõi tồn kho"
        description="Tổng quan tình trạng hàng hóa và biến động kho theo thời gian thực."
        actions={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <TrendingUp className="mr-2 h-4 w-4" />
            Báo cáo nhập xuất
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Vị trí đã sử dụng",
            value: "85%",
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
          {
            label: "Cảnh báo lưu kho",
            value: "12",
            icon: AlertTriangle,
            color: "text-amber-500",
          },
          {
            label: "Sản phẩm luân chuyển",
            value: "450",
            icon: Boxes,
            color: "text-indigo-500",
          },
        ].map((stat, i) => (
          <StatCard
            key={i}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            className="rounded-2xl"
            accentClassName="bg-indigo-500"
          />
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm mã kho, tên khu vực..."
        right={
          <Button variant="outline" className="gap-2 border-slate-200">
            <Filter className="h-4 w-4" />
            Dãy kho
          </Button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <EmptyState
          icon={Boxes}
          title="Lịch sử tồn kho trống"
          description="Hiện chưa có dữ liệu biến động kho nào được ghi lại gần đây."
          className="h-64 sm:h-80"
        />
      </div>
    </div>
  );
}
