import { UserCog, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";

interface PersonalSettingsProps {
  gotoProfile: () => void;
}

export function PersonalSettings({ gotoProfile }: PersonalSettingsProps) {
  const { data: user, isLoading } = useGetCurrentUserQuery();

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
          <CardDescription>Dữ liệu tài khoản hiện tại của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="full-name" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <UserCog className="h-4 w-4 text-indigo-600" />
                Họ tên
              </label>
              <div className="relative">
                <Input 
                  id="full-name" 
                  value={user?.fullName || user?.name || ""} 
                  readOnly 
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50" 
                />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <UserCog className="h-4 w-4 text-indigo-600" />
                Email
              </label>
              <div className="relative">
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  readOnly 
                  type="email" 
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50" 
                />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg block">
                Mẹo: Bạn có thể thay đổi các thông tin này bằng cách nhấp vào "Xem trang cá nhân" ở trên.
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
