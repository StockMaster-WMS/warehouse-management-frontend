"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiErrMessage } from "@/types/api";
import type { SalesOrder } from "@/types/sales-order";
import { useUpdateSalesOrderMutation } from "@/store/services/order.service";

type WarehouseOption = { value: string; label: string };

type OrderEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder;
  warehouseOptions: WarehouseOption[];
};

function buildInitialForm(so: SalesOrder) {
  const a = so.shippingAddress;
  return {
    customerName: so.customerName ?? "",
    line1: a?.line1 ?? "",
    ward: a?.ward ?? "",
    district: a?.district ?? "",
    city: a?.city ?? "",
    country: (a?.country ?? "VN").trim() || "VN",
    warehouseId: so.warehouseId ?? "",
    priority: String(so.priority ?? 5),
  };
}

function OrderEditDialogContent({
  salesOrder,
  warehouseOptions,
  onClose,
}: {
  salesOrder: SalesOrder;
  warehouseOptions: WarehouseOption[];
  onClose: () => void;
}) {
  const [updateOrder, { isLoading }] = useUpdateSalesOrderMutation();
  const init = buildInitialForm(salesOrder);
  const [customerName, setCustomerName] = useState(init.customerName);
  const [line1, setLine1] = useState(init.line1);
  const [ward, setWard] = useState(init.ward);
  const [district, setDistrict] = useState(init.district);
  const [city, setCity] = useState(init.city);
  const [country, setCountry] = useState(init.country);
  const [warehouseId, setWarehouseId] = useState(init.warehouseId);
  const [priority, setPriority] = useState(init.priority);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const soNum = (salesOrder.soNumber ?? "").trim();
    if (!soNum) {
      toast.error("Thiếu mã đơn xuất. Tải lại trang hoặc thử sau.");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Nhập tên khách");
      return;
    }
    if (!warehouseId) {
      toast.error("Chọn kho");
      return;
    }
    const p = Number(priority);
    if (!Number.isInteger(p) || p < 1) {
      toast.error("Độ ưu tiên phải là số nguyên ≥ 1");
      return;
    }
    try {
      const res = await updateOrder({
        id: salesOrder.id,
        body: {
          soNumber: soNum,
          customerName: customerName.trim(),
          shippingAddress: {
            line1: line1.trim(),
            ward: ward.trim(),
            district: district.trim(),
            city: city.trim(),
            country: country.trim().toUpperCase() || "VN",
          },
          warehouseId,
          priority: p,
        },
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Cập nhật thất bại");
        return;
      }
      toast.success(res.message || "Đã cập nhật đơn");
      onClose();
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  return (
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg" showCloseButton>
      <form onSubmit={onSubmit}>
        <DialogHeader>
          <DialogTitle>Sửa thông tin đơn xuất</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mã đơn xuất</label>
            <Input
              readOnly
              tabIndex={-1}
              value={(salesOrder.soNumber ?? "").trim() || "—"}
              className="cursor-default bg-muted/60 text-foreground"
            />
            <p className="text-xs text-muted-foreground">Mã do hệ thống gán khi tạo đơn, không chỉnh sửa.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Khách hàng *</label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Kho xuất *</label>
            <SearchableSelect
              value={warehouseId}
              onValueChange={setWarehouseId}
              options={warehouseOptions}
              dialogTitle="Chọn kho"
              placeholder="Chọn kho..."
              searchPlaceholder="Tìm kho..."
              emptyText="Không có kho"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Độ ưu tiên</label>
            <Input value={priority} onChange={(e) => setPriority(e.target.value)} inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Địa chỉ (dòng 1)</label>
            <Textarea value={line1} onChange={(e) => setLine1(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phường/xã</label>
              <Input value={ward} onChange={(e) => setWard(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quận/huyện</label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tỉnh/thành</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quốc gia</label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="border-0 bg-transparent p-0 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lưu
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function OrderEditDialog({ open, onOpenChange, salesOrder, warehouseOptions }: OrderEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <OrderEditDialogContent
          key={salesOrder.id}
          salesOrder={salesOrder}
          warehouseOptions={warehouseOptions}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}
