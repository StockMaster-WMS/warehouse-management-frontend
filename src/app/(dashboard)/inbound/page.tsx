import { 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  ClipboardCheck, 
  Clock, 
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  ArrowDownLeft,
  Calendar,
  Building2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

const inboundSlips = [
  {
    id: "GRN-2024-001",
    supplier: "Apple Asia Distribution",
    expectedDate: "08/03/2024",
    totalItems: 45,
    receivedItems: 45,
    status: "completed",
    type: "Nhập khẩu"
  },
  {
    id: "GRN-2024-002",
    supplier: "Samsung Electronics VN",
    expectedDate: "10/03/2024",
    totalItems: 120,
    receivedItems: 85,
    status: "processing",
    type: "Nội địa"
  },
  {
    id: "GRN-2024-003",
    supplier: "Logitech Global",
    expectedDate: "12/03/2024",
    totalItems: 300,
    receivedItems: 0,
    status: "pending",
    type: "Nhập khẩu"
  }
];

export default function InboundPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý nhập hàng"
        description="Điều phối hàng về, kiểm đếm chất lượng và phân phối vị trí lưu kho."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Kiểm hàng nhanh
            </Button>
            <Button
              render={<Link href="/inbound/new" />}
              nativeButton={false}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo phiếu nhập
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Chờ xác nhận", value: "3", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Đang kiểm hàng", value: "5", icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50" },
          { label: "Hoàn thành hôm nay", value: "12", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
               <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color} dark:bg-slate-800`}>
                 <stat.icon className="h-5 w-5" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm mã phiếu, nhà cung cấp..." 
                className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2 border-slate-200">
                <Filter className="h-4 w-4" />
                Dòng hàng
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã phiếu & Loại</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Nhà cung cấp</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày dự kiến</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Tiến độ nhận</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inboundSlips.map((slip) => (
                <tr key={slip.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{slip.id}</span>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase mt-1 flex items-center gap-1">
                        <ArrowDownLeft className="h-3 w-3" />
                        {slip.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Building2 className="h-4 w-4 text-slate-400" />
                       <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{slip.supplier}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {slip.expectedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                      <div className="flex w-full items-center justify-between text-[10px] font-bold text-slate-500">
                         <span>{slip.receivedItems}/{slip.totalItems} SP</span>
                         <span>{Math.round((slip.receivedItems/slip.totalItems)*100)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div 
                          className={`h-full transition-all ${slip.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${(slip.receivedItems/slip.totalItems)*100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      slip.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : slip.status === 'processing'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      {slip.status === 'completed' ? 'Đã hoàn thành' : slip.status === 'processing' ? 'Đang nhận hàng' : 'Đang chờ hàng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuGroup>
                           <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuItem className="rounded-lg">
                           <ChevronRight className="mr-2 h-4 w-4" />
                           Chi tiết phiếu
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg">
                           <ClipboardCheck className="mr-2 h-4 w-4" />
                           Bắt đầu kiểm hàng
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-rose-600 focus:text-rose-600">
                           Hủy phiếu nhập
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
