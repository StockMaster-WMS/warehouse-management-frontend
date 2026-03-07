import { BarChart3, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Báo cáo thống kê
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Dữ liệu phân tích giúp bạn đưa ra những quyết định quản lý kho hiệu quả hơn.
          </p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
           <Download className="mr-2 h-4 w-4" />
           Tải báo cáo tổng hợp
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
         {[1, 2, 3, 4].map((i) => (
           <div key={i} className="h-64 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white leading-none">Biểu đồ phân tích #{i}</h3>
              </div>
              <div className="flex h-[180px] items-center justify-center rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                 <span className="text-sm font-medium text-slate-400">Đang khởi tạo dữ liệu...</span>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
