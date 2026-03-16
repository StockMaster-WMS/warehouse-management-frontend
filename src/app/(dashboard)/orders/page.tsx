import { 
  Truck, 
  MapPin, 
  MoreVertical, 
  Filter,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";

export default function OrderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng & giao nhận"
        description="Quản lý hành trình vận chuyển và trạng thái đơn xuất kho."
        actions={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            Hành trình mới
          </Button>
        }
      />

      <SearchToolbar
        placeholder="Tìm theo mã đơn, điểm giao hàng..."
        right={
          <Button variant="outline" className="gap-2 border-slate-200">
            <Filter className="h-4 w-4" />
            Bộ lọc trạng thái
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Trình trạng giao hàng</h3>
             </div>
             <div className="flex flex-col gap-4">
                {[
                  { id: "ORD-2024-001", to: "Hà Nội", status: "Đang vận chuyển", time: "2 giờ trước" },
                  { id: "ORD-2024-002", to: "Đà Nẵng", status: "Chờ lấy hàng", time: "5 giờ trước" },
                  { id: "ORD-2024-003", to: "TP. Hồ Chí Minh", status: "Đã giao", time: "1 ngày trước" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.id}</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3" />
                          <span>{item.to}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Đã giao' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Hoạt động mới nhất</h3>
            </div>
            <div className="space-y-4">
               {[1, 2, 3, 4].map((i) => (
                 <div key={i} className="relative pl-4 border-l border-slate-100 dark:border-slate-800 pb-4 last:pb-0">
                    <div className="absolute left-[-4.5px] top-1 h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-950" />
                    <div className="text-[12px] font-bold text-emerald-600 mb-1">Cập nhật lúc 10:45</div>
                    <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-tight">
                       Đơn hàng #ORD-7789 đã nhập kho trung chuyển tại Long An. 
                    </p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
