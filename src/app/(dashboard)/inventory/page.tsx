"use client";

import { useState } from "react";
import {
  Boxes,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";

export default function InventoryPage() {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("Tất cả dãy kho");

  const hasAnyFilter = query.trim().length > 0 || zone !== "Tất cả dãy kho";
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
        value={query}
        onValueChange={setQuery}
        filters={
          <>
            <div className="flex items-center gap-2 pr-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Filter className="h-4 w-4 text-indigo-500" />
              Bộ lọc
            </div>
            <FilterSelect
              value={zone}
              onChange={setZone}
              placeholder="Dãy kho"
              options={["Khu A - Thiết bị điện tử", "Khu B - Linh kiện", "Khu C - Phụ kiện"]}
              allLabel="Tất cả dãy kho"
              widthClass="sm:w-[220px]"
            />
            {hasAnyFilter && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl px-4 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                onClick={() => {
                  setQuery("");
                  setZone("Tất cả dãy kho");
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Xoá lọc
              </Button>
            )}
          </>
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
