import { 
  ClipboardList, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Filter, 
  LayoutList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InboundPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Nhập hàng (Inbound)
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Theo dõi và quản lý các đơn hàng nhập vào kho.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Tạo phiếu nhập
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Chờ xác nhận", value: "8", isWarning: true },
          { label: "Đang nhập kho", value: "3", isWarning: false },
          { label: "Đã hoàn tất", value: "142", isWarning: false },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</span>
              {stat.isWarning && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
         <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm phiếu nhập theo mã, nhà cung cấp..." 
                className="pl-10 focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
            <ClipboardList className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không có phiếu nhập kho nào</h3>
          <p className="mx-auto mt-1 max-w-[280px] text-sm text-slate-500 text-slate-500">
            Dữ liệu nhập kho trống. Bạn có thể tạo mới phiếu bằng cách nhấn nút "Tạo phiếu nhập" phía trên.
          </p>
        </div>
      </div>
    </div>
  );
}
