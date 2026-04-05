import { UserCog, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PersonalSettingsProps {
  gotoProfile: () => void;
}

export function PersonalSettings({ gotoProfile }: PersonalSettingsProps) {
  return (
    <div className="space-y-6">
      <button
        onClick={gotoProfile}
        className="w-full rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-4 text-left transition-all duration-200 hover:border-indigo-400 hover:shadow-md active:scale-95 dark:border-indigo-600/40 dark:bg-indigo-950/20 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-indigo-600" />
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Xem trang cá nhân</p>
            </div>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 ml-7">
              Chỉnh sửa thông tin chi tiết hơn trên trang cá nhân của bạn
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        </div>
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cá nhân nhanh</CardTitle>
          <CardDescription>Cập nhật thông tin cơ bản trên trang cài đặt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="full-name" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <UserCog className="h-4 w-4 text-indigo-600" />
                Họ tên
              </label>
              <Input id="full-name" defaultValue="An Nguyen" className="rounded-lg border border-slate-200 dark:border-slate-700" />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <UserCog className="h-4 w-4 text-indigo-600" />
                Email
              </label>
              <Input id="email" defaultValue="an.nguyen@stockmaster.vn" type="email" className="rounded-lg border border-slate-200 dark:border-slate-700" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="warehouse-name" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <UserCog className="h-4 w-4 text-indigo-600" />
                Tên kho mặc định
              </label>
              <Input id="warehouse-name" defaultValue="Kho tong mien Nam" className="rounded-lg border border-slate-200 dark:border-slate-700" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
