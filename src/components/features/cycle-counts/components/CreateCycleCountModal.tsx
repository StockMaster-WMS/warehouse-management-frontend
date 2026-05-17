"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Calendar, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useCreateCycleCountMutation } from "@/store/services/cycle-count.service";
import { useGetStockListQuery } from "@/store/services/stock.service";
import { apiErrMessage } from "@/types/api";

const formSchema = z.object({
  warehouseId: z.string().min(1, "Vui lòng chọn kho hàng"),
  scope: z.enum(["WAREHOUSE", "ZONE", "LOCATION", "PRODUCT"]),
  countName: z.string().min(3, "Tên đợt kiểm kê phải ít nhất 3 ký tự"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCycleCountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function createDefaultValues(): FormValues {
  return {
    warehouseId: "",
    scope: "WAREHOUSE",
    countName: `Kiểm kê định kỳ - ${new Date().toLocaleDateString("vi-VN")}`,
    description: "",
  };
}

export function CreateCycleCountModal({
  open,
  onOpenChange,
}: CreateCycleCountModalProps) {
  const { data: warehousesRes, isLoading: warehousesLoading } = useGetWarehousesQuery({
    page: 0,
    size: 100,
  });
  const [createCycleCount, { isLoading: isSubmitting }] = useCreateCycleCountMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(),
  });
  const selectedWarehouseId = useWatch({ control, name: "warehouseId" });
  const { data: stockRes, isLoading: stockLoading } = useGetStockListQuery(
    {
      warehouseId: selectedWarehouseId || undefined,
      page: 0,
      size: 200,
      sort: "updatedAt",
      sortDir: "desc",
    },
    { skip: !selectedWarehouseId },
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(createDefaultValues());
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const stockRows = stockRes?.data?.content ?? [];
      const items = stockRows.reduce<Array<{ productId: string; locationId: string; lotNumber?: string }>>((acc, row) => {
        if (!row.productId || !row.locationId) return acc;
        acc.push({
          productId: row.productId,
          locationId: row.locationId,
          lotNumber: row.lotNumber || undefined,
        });
        return acc;
      }, []);

      if (!items.length) {
        toast.error("Kho đã chọn chưa có tồn kho để sinh dòng kiểm kê.");
        return;
      }

      await createCycleCount({
        warehouseId: values.warehouseId,
        scope: values.scope,
        title: values.countName,
        description: [values.countName, values.description].filter(Boolean).join(" - "),
        items,
      }).unwrap();
      
      toast.success("Đã tạo đợt kiểm kê mới thành công");
      handleOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo đợt kiểm kê"));
    }
  };

  const warehouses = warehousesRes?.data?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 dark:bg-primary/15">
            <ClipboardList className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold">Tạo đợt kiểm kê mới</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Khởi tạo đợt kiểm tra hàng hoá thực tế tại kho để đối soát tồn kho.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Kho kiểm kê <span className="text-rose-500">*</span>
            </Label>
            <Controller
              control={control}
              name="warehouseId"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={warehousesLoading}
                >
                  <SelectTrigger className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder={warehousesLoading ? "Đang tải…" : "Chọn kho hàng để kiểm kê"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id} className="rounded-lg">
                        {wh.name} ({wh.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.warehouseId && (
              <p className="text-xs text-rose-500">{errors.warehouseId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Phạm vi kiểm kê <span className="text-rose-500">*</span>
            </Label>
            <Controller
              control={control}
              name="scope"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Chọn phạm vi" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="WAREHOUSE" className="rounded-lg">Toàn bộ kho</SelectItem>
                    <SelectItem value="ZONE" className="rounded-lg">Theo khu vực (Zone)</SelectItem>
                    <SelectItem value="LOCATION" className="rounded-lg">Theo vị trí (Location)</SelectItem>
                    <SelectItem value="PRODUCT" className="rounded-lg">Theo sản phẩm (Product)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.scope && (
              <p className="text-xs text-rose-500">{errors.scope.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Tên đợt kiểm kê <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                {...register("countName")}
                placeholder="VD: Kiểm kê kho A cuối tháng 5"
                className="h-11 pl-10 rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-primary/20"
              />
            </div>
            {errors.countName && (
              <p className="text-xs text-rose-500">{errors.countName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Ghi chú
            </Label>
            <Textarea
              {...register("description")}
              placeholder="Mục đích kiểm kê hoặc lưu ý đặc biệt…"
              className="min-h-[100px] rounded-xl border-zinc-200 dark:border-zinc-800 resize-none focus:ring-primary/20"
            />
            <p className="text-[11px] italic text-zinc-400">
              Hệ thống sẽ sinh dòng kiểm từ các tồn kho hiện có trong kho đã chọn.
              {selectedWarehouseId
                ? ` ${stockLoading ? "Đang tải tồn kho…" : `Sẵn sàng ${stockRes?.data?.content?.length ?? 0} dòng.`}`
                : ""}
            </p>
            {errors.description && (
              <p className="text-xs text-rose-500">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || stockLoading}
              className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 dark:shadow-none min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang tạo…
                </>
              ) : (
                "Tạo đợt kiểm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
