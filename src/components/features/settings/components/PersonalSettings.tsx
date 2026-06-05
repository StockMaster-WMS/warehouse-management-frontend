import { UserCog, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SettingsField, SettingsPanel } from "@/components/settings/settings-layout";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";

interface PersonalSettingsProps {
  gotoProfile: () => void;
}

export function PersonalSettings({ gotoProfile }: PersonalSettingsProps) {
  const { data: user, isLoading } = useGetCurrentUserQuery();

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={gotoProfile}
        className="w-full rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              <p className="text-sm font-semibold text-primary">Xem trang cá nhân</p>
            </div>
            <p className="ml-7 text-xs text-primary">
              Chỉnh sửa thông tin chi tiết hơn trên trang cá nhân của bạn
            </p>
          </div>
          <ArrowRight className="size-5 flex-shrink-0 text-primary" />
        </div>
      </button>

      <SettingsPanel title="Thông tin cá nhân nhanh" description="Dữ liệu tài khoản hiện tại của bạn">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsField htmlFor="full-name" label="Họ tên" icon={UserCog}>
              <div className="relative">
                <Input 
                  id="full-name" 
                  value={user?.fullName || user?.name || ""} 
                  readOnly 
                  className="bg-muted/40" 
                />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />}
              </div>
            </SettingsField>
            <SettingsField htmlFor="email" label="Email" icon={UserCog}>
              <div className="relative">
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  readOnly 
                  type="email" 
                  className="bg-muted/40" 
                />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />}
              </div>
            </SettingsField>
            <div className="space-y-2 sm:col-span-2">
              <p className="block rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                Mẹo: Bạn có thể thay đổi các thông tin này bằng cách nhấp vào &quot;Xem trang cá nhân&quot; ở trên.
              </p>
            </div>
          </div>
      </SettingsPanel>
    </div>
  );
}
