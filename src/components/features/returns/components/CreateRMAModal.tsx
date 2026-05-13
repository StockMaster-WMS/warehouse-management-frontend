"use client";

import { Plus, Trash2, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray, Controller } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReturnRequestMutation } from "@/store/services/return.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useGetProductsQuery } from "@/store/services/product.service";
import { apiErrMessage } from "@/types/api";
import type { CreateReturnRequestPayload, ReturnReason, ReturnSourceType } from "@/types/returns";

interface CreateRMAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REASONS: Record<ReturnReason, string> = {
  CUSTOMER_RETURN: "Khách trả hàng",
  DAMAGED: "Hàng lỗi / Hỏng",
  WRONG_ITEM: "Giao sai sản phẩm",
  EXPIRED: "Hàng hết hạn",
  QUALITY_CHECK: "Kiểm tra chất lượng",
  SUPPLIER_RETURN: "Trả nhà cung cấp",
};

const SOURCE_TYPES: Record<ReturnSourceType, string> = {
  CUSTOMER: "Khách hàng",
  SUPPLIER: "Nhà cung cấp",
  INTERNAL: "Nội bộ kho",
};

export function CreateRMAModal({ open, onOpenChange }: CreateRMAModalProps) {
  const [createRMA, { isLoading: isCreating }] = useCreateReturnRequestMutation();
  const { data: warehousesRes, isLoading: isLoadingWarehouses } = useGetWarehousesQuery({ page: 0, size: 100 });
  const { data: productsRes, isLoading: isLoadingProducts } = useGetProductsQuery({ page: 0, size: 200 });

  const form = useForm<CreateReturnRequestPayload>({
    defaultValues: {
      sourceType: "CUSTOMER",
      warehouseId: "",
      reason: "CUSTOMER_RETURN",
      lines: [{ productId: "", expectedQty: 1, reason: "CUSTOMER_RETURN" }],
      note: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const onSubmit = async (data: CreateReturnRequestPayload) => {
    try {
      if (!data.warehouseId) return toast.error("Vui lòng chọn kho nhận hàng");
      if (data.lines.some(l => !l.productId)) return toast.error("Vui lòng chọn sản phẩm");

      await createRMA(data).unwrap();
      toast.success("Đã tạo phiếu RMA thành công");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo phiếu RMA"));
    }
  };

  const getWarehouseName = (id: string) => warehousesRes?.data?.content?.find(w => w.id === id)?.name;
  const getProductName = (id: string) => {
    const p = productsRes?.data?.content?.find(p => p.id === id);
    return p ? `${p.sku} - ${p.name}` : undefined;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiếu RMA / Hàng trả</DialogTitle>
          <DialogDescription>
            Khởi tạo hồ sơ tiếp nhận hàng trả về hoặc hàng lỗi trong kho.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nguồn gốc</Label>
              <Controller
                name="sourceType"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue>
                        {field.value ? SOURCE_TYPES[field.value as ReturnSourceType] : "Chọn nguồn..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_TYPES).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Kho nhận hàng</Label>
              <Controller
                name="warehouseId"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue>
                        {isLoadingWarehouses ? "Đang tải..." : getWarehouseName(field.value) || "Chọn kho..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {warehousesRes?.data?.content?.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Lý do chính</Label>
              <Controller
                name="reason"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue>
                        {field.value ? REASONS[field.value as ReturnReason] : "Chọn lý do..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REASONS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Mã đơn hàng (nếu có)</Label>
              <Input placeholder="Ví dụ: SO-2024-001" {...form.register("orderId")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea placeholder="Chi tiết về tình trạng hàng..." {...form.register("note")} className="min-h-[100px]" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <Label className="text-base font-bold">Danh sách sản phẩm</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ productId: "", expectedQty: 1, reason: form.getValues("reason") })}
              >
                <Plus className="mr-2 h-4 w-4" /> Thêm dòng
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3 p-3 rounded-lg border bg-muted/20">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Sản phẩm</Label>
                    <Controller
                      name={`lines.${index}.productId`}
                      control={form.control}
                      render={({ field: subField }) => (
                        <Select onValueChange={subField.onChange} value={subField.value || ""}>
                          <SelectTrigger className="bg-background">
                            <SelectValue>
                              {isLoadingProducts ? "Đang tải..." : getProductName(subField.value) || "Chọn SP..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {productsRes?.data?.content?.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.sku} - {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label className="text-xs">Số lượng</Label>
                    <Input 
                      type="number" 
                      min={1}
                      className="bg-background"
                      {...form.register(`lines.${index}.expectedQty`, { valueAsNumber: true })} 
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-rose-500"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
              Tạo phiếu RMA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
