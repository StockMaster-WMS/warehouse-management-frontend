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
import type { AdjustFormState } from "@/components/features/inventory/constants";
import type { Location } from "@/types/location";
import type { Product } from "@/types/product";

type WarehouseOption = { id: string; name: string; code?: string };

type StockAdjustDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjustType: "qty" | "reserved";
  formState: AdjustFormState;
  setFormState: (updater: (prev: AdjustFormState) => AdjustFormState) => void;
  isSubmitting: boolean;
  onSubmit: () => Promise<boolean>;
  warehouses: WarehouseOption[];
  locations: Location[];
  isLocationsLoading: boolean;
  products: Product[];
  isProductsLoading: boolean;
};

export function StockAdjustDialog({
  open,
  onOpenChange,
  adjustType,
  formState,
  setFormState,
  isSubmitting,
  onSubmit,
  warehouses,
  locations,
  isLocationsLoading,
  products,
  isProductsLoading,
}: StockAdjustDialogProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit();
  };

  const title = adjustType === "qty" ? "Điều chỉnh tồn kho" : "Điều chỉnh giữ chỗ";
  const deltaLabel = adjustType === "qty" ? "Số lượng thay đổi" : "Số lượng giữ chỗ";
  const deltaHint =
    adjustType === "qty"
      ? "> 0: nhập thêm, < 0: trừ đi"
      : "> 0: giữ chỗ thêm, < 0: nhả chỗ";

  const warehouseItems = [
    { value: "__none__", label: "Chọn kho" },
    ...warehouses.map((w) => ({
      value: w.id,
      label: `${w.name}${w.code ? ` (${w.code})` : ""}`,
    })),
  ];

  const locationItems = [
    { value: "__none__", label: "Chọn vị trí" },
    ...locations.map((loc) => ({
      value: loc.id,
      label: `${loc.code} — Z:${loc.zone} A:${loc.aisle} R:${loc.rack}`,
    })),
  ];

  const productItems = [
    { value: "__none__", label: "Chọn sản phẩm" },
    ...products.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.sku})`,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Điều chỉnh thủ công số lượng tồn kho tại một vị trí cụ thể.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label>Kho *</Label>
            <Select
              value={formState.warehouseId || "__none__"}
              onValueChange={(v) =>
                setFormState((prev) => ({
                  ...prev,
                  warehouseId: v === "__none__" ? "" : (v ?? ""),
                  locationId: "",
                }))
              }
              items={warehouseItems}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Chọn kho</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} {w.code ? `(${w.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Vị trí *</Label>
            <Select
              value={formState.locationId || "__none__"}
              onValueChange={(v) =>
                setFormState((prev) => ({
                  ...prev,
                  locationId: v === "__none__" ? "" : (v ?? ""),
                }))
              }
              disabled={!formState.warehouseId}
              items={locationItems}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !formState.warehouseId
                      ? "Vui lòng chọn kho trước"
                      : isLocationsLoading
                        ? "Đang tải vị trí..."
                        : "Chọn vị trí"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Chọn vị trí</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.code} — Z:{loc.zone} A:{loc.aisle} R:{loc.rack}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Sản phẩm *</Label>
            <Select
              value={formState.productId || "__none__"}
              onValueChange={(v) =>
                setFormState((prev) => ({
                  ...prev,
                  productId: v === "__none__" ? "" : (v ?? ""),
                }))
              }
              items={productItems}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isProductsLoading ? "Đang tải sản phẩm..." : "Chọn sản phẩm"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Chọn sản phẩm</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Số lô (tùy chọn)</Label>
            <Input
              value={formState.lotNumber}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, lotNumber: e.target.value }))
              }
              placeholder="VD: LOT-2024-001"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{deltaLabel} *</Label>
            <Input
              type="number"
              value={formState.delta}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, delta: e.target.value }))
              }
              placeholder="VD: 50 hoặc -10"
            />
            <p className="text-xs text-slate-500">{deltaHint}</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
