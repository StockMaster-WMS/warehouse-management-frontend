"use client";

import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Warehouse } from "@/types/warehouse";

export type WarehouseFormState = {
  code: string;
  name: string;
  address: string;
  managerName: string;
  timezone: string;
  isActive: boolean;
};

export const DEFAULT_WAREHOUSE_FORM_STATE: WarehouseFormState = {
  code: "",
  name: "",
  address: "",
  managerName: "",
  timezone: "Asia/Ho_Chi_Minh",
  isActive: true,
};

type WarehouseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingWarehouse: Warehouse | null;
  isSubmitting: boolean;
  formState: WarehouseFormState;
  setFormState: (updater: (prev: WarehouseFormState) => WarehouseFormState) => void;
  onSubmit: () => Promise<boolean>;
};

export function WarehouseFormDialog({
  open,
  onOpenChange,
  editingWarehouse,
  isSubmitting,
  formState,
  setFormState,
  onSubmit,
}: WarehouseFormDialogProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>
            {editingWarehouse ? "Sửa thông tin kho" : "Tạo kho mới"}
          </DialogTitle>
          <DialogDescription>
            {editingWarehouse
              ? "Cập nhật thông tin kho hiện tại."
              : "Nhập thông tin để tạo kho mới trong hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Mã kho <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formState.code}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="VD: WH-HCM01"
                maxLength={20}
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-slate-400">Tối đa 20 ký tự</p>
            </div>

            <div className="space-y-1.5">
              <Label>
                Tên kho <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="VD: Kho trung tâm HCM"
                maxLength={150}
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-slate-400">Tối đa 150 ký tự</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Địa chỉ</Label>
              <Input
                value={formState.address}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="VD: 123 Nguyễn Văn Linh, Q7, TP.HCM"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Người quản lý</Label>
              <Input
                value={formState.managerName}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    managerName: e.target.value,
                  }))
                }
                placeholder="VD: Nguyễn Văn A"
                maxLength={120}
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-slate-400">Tối đa 120 ký tự</p>
            </div>

            <div className="space-y-1.5">
              <Label>Múi giờ</Label>
              <Input
                value={formState.timezone}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    timezone: e.target.value,
                  }))
                }
                placeholder="Asia/Ho_Chi_Minh"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={formState.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    isActive: value !== "inactive",
                  }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : editingWarehouse ? (
                "Cập nhật"
              ) : (
                "Tạo kho"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
