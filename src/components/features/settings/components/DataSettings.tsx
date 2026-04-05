import { Database, AlertCircle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function DataSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Cấu hình dữ liệu</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý thời gian lưu trữ và múi giờ hệ thống</p>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log hệ thống</CardTitle>
            <CardDescription>Cấu hình thời gian lưu trữ nhật ký hoạt động</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="retention" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Số ngày lưu log
              </label>
              <Input id="retention" type="number" defaultValue="90" className="rounded-lg border border-slate-200 dark:border-slate-700" />
              <p className="text-xs text-slate-500 dark:text-slate-400">🔔 Log cũ hơn thời gian này sẽ được tự động xóa</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Múi giờ & Khu vực</CardTitle>
            <CardDescription>Cấu hình múi giờ cho toàn bộ hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="timezone" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Settings className="h-4 w-4 text-indigo-600" />
                Múi giờ hệ thống
              </label>
              <select id="timezone" defaultValue="Asia/Ho_Chi_Minh" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                <option value="Asia/Bangkok">Asia/Bangkok</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400">ℹ️ Múi giờ sẽ áp dụng cho toàn bộ hệ thống</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
