"use client";

import type { FormEvent } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Warehouse, WarehouseManager } from "@/types/warehouse";

export type WarehouseFormState = {
  code: string;
  name: string;
  address: string;
  managerIds: string[];
  timezone: string;
  isActive: boolean;
};

export const DEFAULT_WAREHOUSE_FORM_STATE: WarehouseFormState = {
  code: "",
  name: "",
  address: "",
  managerIds: [],
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
  managers: WarehouseManager[];
  isManagersLoading?: boolean;
  onSubmit: () => Promise<boolean>;
};

function managerLabel(manager: WarehouseManager) {
  const primary = manager.fullName?.trim() || manager.name?.trim() || manager.username;
  return manager.email ? `${primary} (${manager.email})` : primary;
}

export function WarehouseFormDialog({
  open,
  onOpenChange,
  editingWarehouse,
  isSubmitting,
  formState,
  setFormState,
  managers,
  isManagersLoading,
  onSubmit,
}: WarehouseFormDialogProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit();
  };

  const toggleManager = (managerId: string) => {
    setFormState((prev) => {
      const exists = prev.managerIds.includes(managerId);
      return {
        ...prev,
        managerIds: exists
          ? prev.managerIds.filter((id) => id !== managerId)
          : [...prev.managerIds, managerId],
      };
    });
  };

  const selectedManagers = formState.managerIds
    .map((id) => managers.find((manager) => manager.id === id) ?? editingWarehouse?.managers?.find((manager) => manager.id === id))
    .filter((manager): manager is WarehouseManager => Boolean(manager));
  const selectedManagersLabel = selectedManagers.length
    ? selectedManagers.map(managerLabel).join(", ")
    : "Chưa phân công";

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

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Quản lý kho</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting || isManagersLoading}
                      className={cn(
                        "h-auto min-h-10 w-full justify-between rounded-xl px-3 py-2 text-left font-normal",
                        selectedManagers.length ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {isManagersLoading ? "Đang tải danh sách quản lý..." : selectedManagersLabel}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="max-h-72 w-(--anchor-width) min-w-[22rem] overflow-y-auto rounded-xl p-2">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Chọn quản lý kho</DropdownMenuLabel>
                    {managers.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        Chưa có tài khoản quản lý kho active.
                      </div>
                    ) : (
                      managers.map((manager) => {
                        const selected = formState.managerIds.includes(manager.id);
                        return (
                          <DropdownMenuCheckboxItem
                            key={manager.id}
                            checked={selected}
                            onCheckedChange={() => toggleManager(manager.id)}
                            className={cn(
                              "items-start rounded-lg px-2 py-2 pr-8",
                              selected && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{managerLabel(manager)}</span>
                              <span className="block truncate text-xs text-muted-foreground">{manager.username}</span>
                            </span>
                          </DropdownMenuCheckboxItem>
                        );
                      })
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-[10px] text-slate-400">Có thể chọn nhiều quản lý cho một kho.</p>
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
