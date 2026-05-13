"use client";

import { useState } from "react";
import { Users, FileText, Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleOptionRow } from "@/components/settings/toggle-option-row";
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
      <Card className="border-indigo-100 dark:border-indigo-900/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-600" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>Bạn nên sử dụng mật khẩu mạnh để bảo vệ tài khoản</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu cũ</label>
                <Input 
                  type="password" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu mới</label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu</label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            Quyền truy cập hệ thống
          </CardTitle>
          <CardDescription>Cấu hình quyền hạn mặc định cho các đối tượng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Vai trò mặc định cho nhân viên mới
              </label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all">
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
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            Audit Log & Bảo mật dữ liệu
          </CardTitle>
          <CardDescription>Lịch sử hoạt động và thay đổi hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <ToggleOptionRow icon={FileText} label="Bật audit log" description="Ghi lại tất cả thay đổi quan trọng trong hệ thống" checked={true} onCheckedChange={() => {}} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Thời gian lưu audit log</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all">
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
