import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký hoạt động"
        description="Ghi lại mọi thay đổi và hoạt động trong hệ thống theo thời gian thực."
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <EmptyState
          icon={History}
          title="Chưa có hoạt động nào"
          description="Mọi thao tác của người dùng sẽ được lưu trữ tại đây để đảm bảo tính minh bạch."
          action={
            <Button variant="outline" size="sm" className="border-slate-200">
              <RotateCcw className="mr-2 h-4 w-4" />
              Làm mới lịch sử
            </Button>
          }
          className="h-100 sm:h-125"
        />
      </div>
    </div>
  );
}
