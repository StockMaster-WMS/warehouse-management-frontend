"use client";

import { useState } from "react";
import { Users, FileText, Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleOptionRow } from "@/components/settings/toggle-option-row";
import {
  SettingsField,
  SettingsPanel,
  settingsSelectClassName,
} from "@/components/settings/settings-layout";
import { useChangePasswordMutation } from "@/store/services/auth.service";
import { apiErrMessage } from "@/types/api";

export function SecuritySettings() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ các trường");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword }).unwrap();
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(apiErrMessage(err, "Đổi mật khẩu thất bại"));
    }
  };

  return (
    <div className="space-y-6">
      <SettingsPanel
        icon={Lock}
        title="Đổi mật khẩu"
        description="Bạn nên sử dụng mật khẩu mạnh để bảo vệ tài khoản"
      >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SettingsField label="Mật khẩu cũ">
                <Input 
                  type="password" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </SettingsField>
              <SettingsField label="Mật khẩu mới">
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </SettingsField>
              <SettingsField label="Xác nhận mật khẩu">
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </SettingsField>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="rounded-lg">
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>
      </SettingsPanel>

      <SettingsPanel
        icon={Users}
        title="Quyền truy cập hệ thống"
        description="Cấu hình quyền hạn mặc định cho các đối tượng"
      >
          <div className="space-y-3">
            <SettingsField label="Vai trò mặc định cho nhân viên mới">
              <select className={settingsSelectClassName}>
                <option value="staff">Nhân viên kho</option>
                <option value="manager">Quản lý kho</option>
                <option value="viewer">Người xem</option>
              </select>
            </SettingsField>
          </div>
      </SettingsPanel>

      <SettingsPanel
        icon={FileText}
        title="Audit Log & Bảo mật dữ liệu"
        description="Lịch sử hoạt động và thay đổi hệ thống"
      >
          <div className="space-y-3">
            <ToggleOptionRow icon={FileText} label="Bật audit log" description="Ghi lại tất cả thay đổi quan trọng trong hệ thống" checked={true} onCheckedChange={() => {}} />
            <SettingsField label="Thời gian lưu audit log">
              <select className={settingsSelectClassName}>
                <option value="90">90 ngày</option>
                <option value="180">180 ngày</option>
                <option value="365">1 năm</option>
              </select>
            </SettingsField>
          </div>
      </SettingsPanel>
    </div>
  );
}
