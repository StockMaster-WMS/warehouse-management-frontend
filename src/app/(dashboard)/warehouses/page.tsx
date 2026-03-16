"use client";

import {
  Building2,
  MapPin,
  Plus,
  Boxes,
  LayoutDashboard,
  MoreVertical,
  ChevronRight,
  Navigation,
  Activity,
  User,
  ThermometerSnowflake,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

const warehouses = [
  {
    id: "WH-HCM-01",
    name: "Kho Tổng Miền Nam",
    location: "Khu Công Nghệ Cao, Q.9, TP. HCM",
    manager: "An Nguyễn",
    capacity: 85,
    zones: 12,
    bins: 1250,
    status: "active",
    type: "Tổng hợp",
    tags: ["Security 24/7", "Fire System"]
  },
  {
    id: "WH-HN-02",
    name: "Trung Tâm Phối Hà Nội",
    location: "KCN Quang Minh, Mê Linh, Hà Nội",
    manager: "Trần Thế Anh",
    capacity: 42,
    zones: 8,
    bins: 800,
    status: "active",
    type: "Tổng hợp",
    tags: ["Express Shipping"]
  },
  {
    id: "WH-C-COLD",
    name: "Kho Lạnh - Cơ Sở 3",
    location: "KCN Sóng Thần, Bình Dương",
    manager: "Lê Minh Tâm",
    capacity: 92,
    zones: 4,
    bins: 200,
    status: "warning",
    type: "Kho lạnh",
    tags: ["Temp Control"]
  }
];

export default function WarehousesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách kho"
        description="Hệ thống quản lý không gian lưu trữ và mạng lưới kho bãi."
        actions={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none">
            <Plus className="mr-2 h-4 w-4" />
            Thêm kho mới
          </Button>
        }
      />

      <SearchToolbar
        placeholder="Tìm theo tên kho hoặc địa chỉ..."
        className="max-w-2xl"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {warehouses.map((wh) => (
          <div key={wh.id} className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                  {wh.type === 'Kho lạnh' ? <ThermometerSnowflake className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`rounded-full border-none px-2 py-0.5 text-[10px] font-bold ${wh.status === 'active'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                    }`}>
                    {wh.status === 'active' ? 'Đang hoạt động' : 'Đầy / Sắp đầy'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Quản lý kho</DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuItem className="rounded-lg">Sửa thông tin</DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg">Xem bản đồ kho</DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg text-rose-600 focus:text-rose-600">Tạm dừng HĐ</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{wh.name}</h3>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {wh.location}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-wider">Tỷ lệ lấp đầy</span>
                    <span className={wh.capacity > 90 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}>{wh.capacity}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full transition-all ${wh.capacity > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                      style={{ width: `${wh.capacity}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                    <LayoutDashboard className="h-4 w-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Zones</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{wh.zones}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                    <Boxes className="h-4 w-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Bins</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{wh.bins}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-slate-100 p-4 dark:border-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-200 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 leading-none">Quản lý</span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{wh.manager}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-indigo-600 transition-all hover:bg-indigo-50 dark:text-indigo-400">
                  Chi tiết
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Warehouse Placeholder */}
        <button className="flex min-h-75 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 transition-all hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Plus className="h-6 w-6" />
          </div>
          <span className="mt-3 text-sm font-bold text-slate-500">Tạo khu vực kho mới</span>
        </button>
      </div>
    </div>
  );
}
