"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiErrMessage } from "@/types/api";
import type { SoItem } from "@/types/so-item";
import { useUpdateSoItemMutation } from "@/store/services/so-item.service";

type SoLineEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: SoItem | null;
};

export function SoLineEditDialog({ open, onOpenChange, line }: SoLineEditDialogProps) {
  const [updateLine, { isLoading }] = useUpdateSoItemMutation();
  const [orderedQtyStr, setOrderedQtyStr] = useState("");
  const [shippedQtyStr, setShippedQtyStr] = useState("");
  const [unitPriceStr, setUnitPriceStr] = useState("");

  useEffect(() => {
    if (!open || !line) return;
    setOrderedQtyStr(String(line.orderedQty ?? ""));
    setShippedQtyStr(line.shippedQty != null ? String(line.shippedQty) : "");
    setUnitPriceStr(line.unitPrice != null ? String(line.unitPrice) : "");
  }, [open, line]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!line) return;
    const orderedQty = Number(String(orderedQtyStr).replace(",", "."));
    if (!Number.isFinite(orderedQty) || orderedQty <= 0) {
      toast.error("Số lượng đặt phải > 0");
      return;
    }
    let shippedQty: number | null | undefined;
    if (shippedQtyStr.trim()) {
      const s = Number(shippedQtyStr.replace(",", "."));
      if (!Number.isFinite(s) || s < 0) {
        toast.error("SL giao không hợp lệ");
        return;
      }
      shippedQty = s;
    }
    let unitPrice: number | null | undefined;
    if (unitPriceStr.trim()) {
      const u = Number(unitPriceStr.replace(",", "."));
      if (Number.isFinite(u) && u >= 0) unitPrice = u;
    }
    try {
      const res = await updateLine({
        id: line.id,
        body: {
          salesOrderId: line.salesOrderId,
          lineNumber: line.lineNumber,
          productId: line.productId,
          productSku: line.productSku,
          orderedQty,
          shippedQty: shippedQty ?? undefined,
          unitPrice: unitPrice ?? undefined,
        },
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Cập nhật dòng thất bại");
        return;
      }
      toast.success(res.message || "Đã cập nhật dòng");
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  if (!line) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              Sửa dòng #{line.lineNumber} · {line.productSku}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Số lượng đặt *</label>
              <Input value={orderedQtyStr} onChange={(e) => setOrderedQtyStr(e.target.value)} inputMode="decimal" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">SL đã giao (shippedQty)</label>
              <Input value={shippedQtyStr} onChange={(e) => setShippedQtyStr(e.target.value)} inputMode="decimal" placeholder="Để trống nếu 0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Đơn giá</label>
              <Input value={unitPriceStr} onChange={(e) => setUnitPriceStr(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <DialogFooter className="border-0 bg-transparent p-0 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
