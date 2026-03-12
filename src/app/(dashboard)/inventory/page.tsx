import {
  Boxes,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tồn kho"
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
            className="rounded-xl"
            accentClassName="bg-indigo-500"
          />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm mã kho, tên khu vực..."
                className="pl-10 focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Dãy kho
              </Button>
            </div>
          </div>
        </div>

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
