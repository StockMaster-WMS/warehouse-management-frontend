import { Users, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleOptionRow } from "@/components/settings/toggle-option-row";

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quyền truy cập</CardTitle>
          <CardDescription>Cấu hình quyền hạn theo vai trò người dùng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Users className="h-4 w-4 text-indigo-600" />
                Vai trò mặc định cho nhân viên mới
              </label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="staff">Nhân viên kho</option>
                <option value="manager">Quản lý kho</option>
                <option value="viewer">Người xem</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Log</CardTitle>
          <CardDescription>Lịch sử hoạt động và thay đổi hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <ToggleOptionRow icon={FileText} label="Bật audit log" description="Ghi lại tất cả thay đổi quan trọng trong hệ thống" checked={true} onCheckedChange={() => {}} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Thời gian lưu audit log</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="90">90 ngày</option>
                <option value="180">180 ngày</option>
                <option value="365">1 năm</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
