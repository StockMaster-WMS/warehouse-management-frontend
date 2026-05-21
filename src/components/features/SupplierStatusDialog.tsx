"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/select";
import { apiErrMessage } from "@/types/api";
import type { Supplier, SupplierStatus } from "@/types/supplier";
import { SUPPLIER_STATUS_LABEL } from "@/types/supplier";
import { useChangeSupplierStatusMutation } from "@/store/services/supplier.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
};

export function SupplierStatusDialog({ open, onOpenChange, supplier }: Props) {
  const [status, setStatus] = useState<SupplierStatus>("active");
  const [changeStatus, { isLoading }] = useChangeSupplierStatusMutation();

  function handleOpen(v: boolean) {
    if (v && supplier) setStatus(supplier.status);
    onOpenChange(v);
  }

  async function handleConfirm() {
    if (!supplier) return;
    if (status === supplier.status) {
      onOpenChange(false);
      return;
    }
    try {
      const res = await changeStatus({ id: supplier.id, status }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Đổi trạng thái thất bại");
        return;
      }
      toast.success(
        `Đã chuyển trạng thái sang "${SUPPLIER_STATUS_LABEL[status]}"`,
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi trạng thái nhà cung cấp</DialogTitle>
          <DialogDescription>
            {supplier ? (
              <>
                Thay đổi trạng thái cho{" "}
                <span className="font-medium text-foreground">
                  {supplier.name}
                </span>
              </>
            ) : (
              "Chọn trạng thái mới"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as SupplierStatus)}
          >
            <SelectTrigger>
              <span className="flex flex-1 truncate text-left">
                {SUPPLIER_STATUS_LABEL[status] ?? status}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
              <SelectItem value="suspended">Tạm ngưng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
