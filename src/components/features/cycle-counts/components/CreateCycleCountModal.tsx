"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ClipboardList, Plus, Trash2, Box, MapPin, Tag, Layers } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useCreateCycleCountMutation } from "@/store/services/cycle-count.service";
import { useGetProductsQuery } from "@/store/services/product.service";
import { useGetLocationsListQuery } from "@/store/services/location.service";
import { apiErrMessage } from "@/types/api";
import type { CreateCycleCountPayload } from "@/types/cycle-count";

const cycleCountItemSchema = z.object({
  productId: z.string().min(1, "Vui lòng chọn sản phẩm"),
  locationId: z.string().min(1, "Vui lòng chọn vị trí"),
  lotNumber: z.string().optional(),
});

const formSchema = z.object({
  warehouseId: z.string().min(1, "Vui lòng chọn kho hàng"),
  description: z.string().min(1, "Tên đợt kiểm kê là bắt buộc"),
  mode: z.enum(["SCOPE", "MANUAL"]),
  scope: z.enum(["WAREHOUSE", "ZONE", "LOCATION", "PRODUCT"]),
  scopeValue: z.string().optional(),
  items: z.array(cycleCountItemSchema),
}).superRefine((data, ctx) => {
  if (data.mode === "SCOPE") {
    if (data.scope !== "WAREHOUSE" && !data.scopeValue?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scopeValue"],
        message: "Giá trị phạm vi là bắt buộc khi chọn phạm vi này.",
      });
    }
  }

  if (data.mode === "MANUAL") {
    if (!data.items || data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Vui lòng thêm ít nhất một sản phẩm để kiểm kê.",
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCycleCountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function createDefaultValues(): FormValues {
  return {
    warehouseId: "",
    description: `Kiểm kê định kỳ - ${new Date().toLocaleDateString("vi-VN")}`,
    mode: "SCOPE",
    scope: "WAREHOUSE",
    scopeValue: "",
    items: [],
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
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(),
  });

  const mode = useWatch({ control, name: "mode" });
  const scope = useWatch({ control, name: "scope" });
  const scopeValue = useWatch({ control, name: "scopeValue" });
  const warehouseId = useWatch({ control, name: "warehouseId" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Fetch products and locations for selects
  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery(
    { warehouseId, size: 1000 },
    { skip: !warehouseId || (mode !== "MANUAL" && scope !== "PRODUCT") }
  );
  const { data: locationsRes, isLoading: locationsLoading } = useGetLocationsListQuery(
    { warehouseId, size: 1000 },
    { skip: !warehouseId || (mode !== "MANUAL" && scope !== "LOCATION") }
  );

  const productOptions = (productsRes?.data?.content ?? []).map(p => ({
    value: p.id,
    label: p.name,
    hint: p.sku || undefined
  }));

  const locationOptions = (locationsRes?.data?.content ?? []).map(l => ({
    value: l.id,
    label: `${l.zone} - ${l.aisle}-${l.rack}-${l.level}-${l.bin}`,
    hint: l.id.substring(0, 8)
  }));

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset(createDefaultValues());
    }
  }, [open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset(createDefaultValues());
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let payload: CreateCycleCountPayload;

      if (values.mode === "SCOPE") {
        payload = {
          warehouseId: values.warehouseId,
          description: values.description,
          scope: values.scope,
          scopeValue: values.scope !== "WAREHOUSE" ? values.scopeValue || null : null,
        };
      } else {
        payload = {
          warehouseId: values.warehouseId,
          description: values.description,
          items: values.items.map((item) => ({
            productId: item.productId,
            locationId: item.locationId,
            lotNumber: item.lotNumber?.trim() || undefined,
          })),
        };
      }

      await createCycleCount(payload).unwrap();
      toast.success("Đã tạo đợt kiểm kê mới thành công");
      handleOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo đợt kiểm kê"));
    }
  };

  const warehouses = warehousesRes?.data?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-slate-50/50 backdrop-blur-xl dark:bg-slate-950/50">
        <div className="bg-white dark:bg-slate-900 p-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 dark:bg-indigo-950/30">
              <ClipboardList className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">Tạo đợt kiểm kê mới</DialogTitle>
            <DialogDescription className="text-slate-500 text-base">
              Khởi tạo đợt kiểm tra hàng hoá thực tế tại kho để đối soát tồn kho.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[70vh]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
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
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20">
                        <SelectValue placeholder={warehousesLoading ? "Đang tải..." : "Chọn kho hàng"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-xl border-slate-200 dark:border-slate-800">
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id} className="rounded-xl">
                            {wh.name} ({wh.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.warehouseId && (
                  <p className="text-[11px] font-medium text-rose-500 ml-2">{errors.warehouseId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Tên đợt kiểm kê <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register("description")}
                  placeholder="VD: Kiểm kê cuối tháng 5..."
                  className="h-12 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                />
                {errors.description && (
                  <p className="text-[11px] font-medium text-rose-500 ml-2">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                Phương thức chọn hàng <span className="text-rose-500">*</span>
              </Label>
              <Tabs
                value={mode}
                onValueChange={(v) => setValue("mode", v as FormValues["mode"])}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <TabsTrigger value="SCOPE" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-950 transition-all">
                    <Layers className="h-4 w-4 mr-2" />
                    Theo phạm vi
                  </TabsTrigger>
                  <TabsTrigger value="MANUAL" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-950 transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Chọn thủ công
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="SCOPE" className="pt-4 space-y-4 animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-slate-500 ml-1">Phạm vi kiểm kê</Label>
                      <Controller
                        control={control}
                        name="scope"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50">
                              <SelectValue placeholder="Chọn phạm vi" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="WAREHOUSE">Toàn bộ kho</SelectItem>
                              <SelectItem value="ZONE">Theo khu vực (Zone)</SelectItem>
                              <SelectItem value="LOCATION">Theo vị trí (Location)</SelectItem>
                              <SelectItem value="PRODUCT">Theo sản phẩm (Product)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {scope !== "WAREHOUSE" && (
                      <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                        <Label className="text-[11px] font-semibold text-slate-500 ml-1">
                          {scope === "ZONE" ? "Tên khu vực" : scope === "LOCATION" ? "Vị trí cụ thể" : "Sản phẩm cụ thể"}
                        </Label>

                        {scope === "ZONE" ? (
                          <Input
                            {...register("scopeValue")}
                            placeholder="VD: ZONE-A..."
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50"
                          />
                        ) : scope === "LOCATION" ? (
                          <Controller
                            control={control}
                            name="scopeValue"
                            render={({ field }) => (
                              <SearchableSelect
                                dialogTitle="Chọn vị trí kiểm kê"
                                options={locationOptions}
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                placeholder="Tìm vị trí..."
                                className="h-11 rounded-xl border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50"
                                loading={locationsLoading}
                                disabled={!warehouseId}
                              />
                            )}
                          />
                        ) : (
                          <Controller
                            control={control}
                            name="scopeValue"
                            render={({ field }) => (
                              <SearchableSelect
                                dialogTitle="Chọn sản phẩm kiểm kê"
                                options={productOptions}
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                placeholder="Tìm sản phẩm..."
                                className="h-11 rounded-xl border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50"
                                loading={productsLoading}
                                disabled={!warehouseId}
                              />
                            )}
                          />
                        )}
                        {errors.scopeValue && (
                          <p className="text-[10px] text-rose-500 ml-1">{errors.scopeValue.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                      <Layers className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">Thông tin phạm vi</p>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
                        Hệ thống sẽ quét và tạo danh sách kiểm kê cho tất cả sản phẩm thuộc {
                          scope === "WAREHOUSE" ? "toàn bộ kho hàng hiện tại." :
                          scope === "ZONE" ? `khu vực "${scopeValue || '...'}"` :
                          scope === "LOCATION" ? "vị trí cụ thể mà bạn đã chọn." : "sản phẩm cụ thể mà bạn đã chọn."
                        }
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="MANUAL" className="pt-4 space-y-4 animate-in fade-in-50 duration-300">
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="group relative grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 pt-6 md:pt-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in zoom-in-95 duration-200"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="absolute -top-2 -right-2 md:top-2 md:right-2 h-7 w-7 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm md:shadow-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <div className="md:col-span-5 space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-400 ml-1 flex items-center tracking-wider">
                            <Box className="h-3 w-3 mr-1 text-slate-300" /> SẢN PHẨM
                          </Label>
                          <Controller
                            control={control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <SearchableSelect
                                dialogTitle="Chọn sản phẩm"
                                options={productOptions}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Chọn..."
                                className="h-10 rounded-xl bg-slate-50/50 border-none hover:bg-slate-100/50 dark:bg-slate-950/50"
                                loading={productsLoading}
                                disabled={!warehouseId}
                              />
                            )}
                          />
                        </div>

                        <div className="md:col-span-4 space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-400 ml-1 flex items-center tracking-wider">
                            <MapPin className="h-3 w-3 mr-1 text-slate-300" /> VỊ TRÍ
                          </Label>
                          <Controller
                            control={control}
                            name={`items.${index}.locationId`}
                            render={({ field }) => (
                              <SearchableSelect
                                dialogTitle="Chọn vị trí"
                                options={locationOptions}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Chọn..."
                                className="h-10 rounded-xl bg-slate-50/50 border-none hover:bg-slate-100/50 dark:bg-slate-950/50"
                                loading={locationsLoading}
                                disabled={!warehouseId}
                              />
                            )}
                          />
                        </div>

                        <div className="md:col-span-3 space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-400 ml-1 flex items-center tracking-wider">
                            <Tag className="h-3 w-3 mr-1 text-slate-300" /> SỐ LÔ
                          </Label>
                          <Input
                            {...register(`items.${index}.lotNumber`)}
                            placeholder="Không bắt buộc"
                            className="h-10 rounded-xl bg-slate-50/50 border-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-950/50"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ productId: "", locationId: "", lotNumber: "" })}
                      disabled={!warehouseId}
                      className="w-full h-12 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm sản phẩm kiểm kê
                    </Button>

                    {errors.items && (
                      <p className="text-xs text-rose-500 text-center font-medium">{errors.items.message}</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium italic">
              {!warehouseId ? "⚠️ Chọn kho trước khi thêm sản phẩm" : "💡 Điền đầy đủ thông tin trước khi tạo"}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-11 px-6 hover:bg-slate-50"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none min-w-[160px] font-semibold text-white transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang khởi tạo...
                  </>
                ) : (
                  "Tạo đợt kiểm kê"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
