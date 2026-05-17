import { UserCog, ArrowRight, Loader2 } from "lucide-react";
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
        className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/10 p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md active:scale-95 dark:border-primary/30 dark:bg-primary/10 dark:hover:border-primary/50 dark:hover:bg-primary/15"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              <p className="text-sm font-semibold text-primary dark:text-primary">Xem trang cá nhân</p>
            </div>
            <p className="text-xs text-primary dark:text-primary ml-7">
              Chỉnh sửa thông tin chi tiết hơn trên trang cá nhân của bạn
            </p>
          </div>
          <ArrowRight className="size-5 text-primary dark:text-primary flex-shrink-0" />
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
              <label htmlFor="full-name" className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                <UserCog className="size-4 text-primary" />
                Họ tên
              </label>
              <div className="relative">
                <Input 
                  id="full-name" 
                  value={user?.fullName || user?.name || ""} 
                  readOnly 
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50" 
                />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-zinc-400" />}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                <UserCog className="size-4 text-primary" />
                Email
              </label>
              <div className="relative">
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  readOnly 
                  type="email" 
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50" 
                />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-zinc-400" />}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="block rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-600 dark:bg-amber-950/20">
                Mẹo: Bạn có thể thay đổi các thông tin này bằng cách nhấp vào &quot;Xem trang cá nhân&quot; ở trên.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
