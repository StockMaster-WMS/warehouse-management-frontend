"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
    defaultValues: {
      warehouseId: "",
      scope: "WAREHOUSE",
      countName: `Kiểm kê định kỳ - ${new Date().toLocaleDateString("vi-VN")}`,
      description: "",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        warehouseId: "",
        scope: "WAREHOUSE",
        countName: `Kiểm kê định kỳ - ${new Date().toLocaleDateString("vi-VN")}`,
        description: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createCycleCount({
        ...values,
        title: values.countName, // Backend might expect title
      }).unwrap();
      
      toast.success("Đã tạo đợt kiểm kê mới thành công");
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo đợt kiểm kê"));
    }
  };

  const warehouses = warehousesRes?.data?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4 dark:bg-indigo-950/30">
            <ClipboardList className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold">Tạo đợt kiểm kê mới</DialogTitle>
          <DialogDescription className="text-slate-500">
            Khởi tạo đợt kiểm tra hàng hoá thực tế tại kho để đối soát tồn kho.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">
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
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder={warehousesLoading ? "Đang tải..." : "Chọn kho hàng để kiểm kê"} />
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
            <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">
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
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-800">
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
            <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Tên đợt kiểm kê <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                {...register("countName")}
                placeholder="VD: Kiểm kê kho A cuối tháng 5"
                className="h-11 pl-10 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
              />
            </div>
            {errors.countName && (
              <p className="text-xs text-rose-500">{errors.countName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Ghi chú
            </Label>
            <Textarea
              {...register("description")}
              placeholder="Mục đích kiểm kê hoặc lưu ý đặc biệt..."
              className="min-h-[100px] rounded-xl border-slate-200 dark:border-slate-800 resize-none focus:ring-indigo-500/20"
            />
            <p className="text-[11px] italic text-slate-400">
              Ghi chú sẽ giúp nhân viên kho hiểu rõ yêu cầu đợt kiểm này.
            </p>
            {errors.description && (
              <p className="text-xs text-rose-500">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
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
