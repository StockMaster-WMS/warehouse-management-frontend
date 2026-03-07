import { History, Search, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Lịch sử hoạt động
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Ghi lại mọi thay đổi và hoạt động trong hệ thống theo thời gian thực.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex h-[400px] flex-col items-center justify-center p-8 text-center sm:h-[500px]">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
            <History className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chưa có hoạt động nào</h3>
          <p className="mx-auto mt-1 max-w-[280px] text-sm text-slate-500 text-slate-500">
            Mọi thao tác của người dùng sẽ được lưu trữ tại đây để đảm bảo tính minh bạch.
          </p>
        </div>
      </div>
    </div>
  );
}
