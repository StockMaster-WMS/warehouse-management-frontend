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
import { useGetUsersQuery } from "@/store/services/user-management.service";
import { apiErrMessage } from "@/types/api";
import { cn } from "@/lib/utils";
import type { CreateCycleCountPayload } from "@/types/cycle-count";

const cycleCountItemSchema = z.object({
  productId: z.string().min(1, "Vui lòng chọn sản phẩm"),
  locationId: z.string().min(1, "Vui lòng chọn vị trí"),
  lotNumber: z.string().optional(),
});

const formSchema = z.object({
  warehouseId: z.string().min(1, "Vui lòng chọn kho hàng"),
  description: z.string().min(1, "Tên đợt kiểm kê là bắt buộc"),
  assignedTo: z.string().min(1, "Vui lòng chọn nhân viên kiểm kê"),
  scheduledAt: z.string().optional(),
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
    assignedTo: "",
    scheduledAt: "",
    mode: "SCOPE",
    scope: "WAREHOUSE",
    scopeValue: "",
    items: [],
  };
}

function toIsoWithLocalTimezone(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const pad = (num: number) => String(num).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`;
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
  const { data: staffRes, isLoading: staffLoading } = useGetUsersQuery({
    page: 0,
    size: 200,
    role: "WAREHOUSE_STAFF",
    active: true,
    sort: "fullName",
    sortDir: "asc",
  }, { skip: !open });

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
  const manualItems = useWatch({ control, name: "items" }) ?? [];

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
  const plannedCountText = mode === "MANUAL"
    ? `${manualItems.length.toLocaleString("vi-VN")} dòng sản phẩm/vị trí`
    : scope === "WAREHOUSE"
      ? "Toàn bộ vị trí và sản phẩm trong kho"
      : scope === "LOCATION"
        ? scopeValue ? "1 vị trí đã chọn" : "Chưa chọn vị trí"
        : scope === "PRODUCT"
          ? scopeValue ? "1 sản phẩm đã chọn" : "Chưa chọn sản phẩm"
          : scopeValue ? `Khu vực ${scopeValue}` : "Chưa nhập khu vực";

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
          assignedTo: values.assignedTo,
          scheduledAt: toIsoWithLocalTimezone(values.scheduledAt),
          scope: values.scope,
          scopeValue: values.scope !== "WAREHOUSE" ? values.scopeValue || null : null,
          items: null,
        };
      } else {
        payload = {
          warehouseId: values.warehouseId,
          description: values.description,
          assignedTo: values.assignedTo,
          scheduledAt: toIsoWithLocalTimezone(values.scheduledAt),
          scope: null,
          scopeValue: null,
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
  const staffUsers = staffRes?.data?.content ?? [];
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId);
  const selectedStaffId = useWatch({ control, name: "assignedTo" });
  const selectedStaff = staffUsers.find((user) => user.id === selectedStaffId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-3xl">
        <div className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
          <DialogHeader className="gap-2 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Tạo đợt kiểm kê</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Chọn kho, phạm vi hoặc danh sách sản phẩm cần kiểm kê.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[calc(92vh-5rem)] flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-6 dark:bg-slate-950/30">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Thông tin chung</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">
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
                        <span className={cn("truncate text-sm", !selectedWarehouse && "text-muted-foreground")}>
                          {warehousesLoading
                            ? "Đang tải kho..."
                            : selectedWarehouse
                              ? `${selectedWarehouse.name}${selectedWarehouse.code ? ` (${selectedWarehouse.code})` : ""}`
                              : "Chọn kho hàng"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200 shadow-lg dark:border-slate-800">
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
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
                <Label className="text-xs font-bold uppercase text-slate-500">
                  Tên đợt kiểm kê <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register("description")}
                  placeholder="VD: Kiểm kê cuối tháng 5..."
                  className="h-10 rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                />
                {errors.description && (
                  <p className="text-[11px] font-medium text-rose-500 ml-2">{errors.description.message}</p>
                )}
              </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Nhân viên kiểm kê <span className="text-rose-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="assignedTo"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={staffLoading}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20">
                        <span className={cn("truncate text-sm", !selectedStaff && "text-muted-foreground")}>
                          {staffLoading
                            ? "Đang tải nhân viên..."
                            : selectedStaff
                              ? `${selectedStaff.fullName || selectedStaff.username}${selectedStaff.email ? ` (${selectedStaff.email})` : ""}`
                              : "Chọn nhân viên kho"}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-xl border-slate-200 dark:border-slate-800">
                        {staffUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="rounded-xl">
                            {user.fullName || user.username} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.assignedTo && (
                  <p className="text-[11px] font-medium text-rose-500 ml-2">{errors.assignedTo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Lịch kiểm kê
                </Label>
                <Input
                  {...register("scheduledAt")}
                  type="datetime-local"
                  className="h-12 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase text-slate-500">
                    Phương thức chọn hàng <span className="text-rose-500">*</span>
                  </Label>
                  <p className="mt-1 text-xs text-slate-500">Chọn theo phạm vi lớn hoặc nhập danh sách thủ công.</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  <span className="font-semibold">Dự kiến: </span>
                  {plannedCountText}
                </div>
              </div>
              <Tabs
                value={mode}
                onValueChange={(v) => setValue("mode", v as FormValues["mode"])}
                className="w-full"
              >
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
                  <TabsTrigger value="SCOPE" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-indigo-700 data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-indigo-700 dark:data-[state=active]:border-indigo-900/50 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-200">
                    <Layers className="size-4 mr-2" />
                    Theo phạm vi
                  </TabsTrigger>
                  <TabsTrigger value="MANUAL" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-indigo-700 data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-indigo-700 dark:data-[state=active]:border-indigo-900/50 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-200">
                    <Plus className="size-4 mr-2" />
                    Chọn thủ công
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="SCOPE" className="pt-4 space-y-4 animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-slate-500 ml-1">Phạm vi kiểm kê</Label>
                      <Controller
                        control={control}
                        name="scope"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="min-h-10 rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                              <SelectValue placeholder="Chọn phạm vi" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
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
                            className="h-10 rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
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
                                className="h-10 rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
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
                                className="h-10 rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
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
                  <div className="flex gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                    <div className="size-6 rounded-md bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                      <Layers className="size-3.5 text-indigo-600" />
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ productId: "", locationId: "", lotNumber: "" })}
                      disabled={!warehouseId}
                      className="h-11 w-full rounded-lg border-dashed border-indigo-200 bg-indigo-50/50 font-semibold text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-300"
                    >
                      <Plus className="size-4 mr-2" />
                      Thêm sản phẩm kiểm kê
                    </Button>

                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="group relative grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 pt-6 md:grid-cols-12 md:pt-4 dark:border-slate-800 dark:bg-slate-950/30"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="absolute -top-2 -right-2 md:top-2 md:right-2 size-7 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm md:shadow-none"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>

                        <div className="md:col-span-5 space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-400 ml-1 flex items-center tracking-wider">
                            <Box className="size-3 mr-1 text-slate-300" /> SẢN PHẨM
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
                                className="h-10 rounded-lg bg-white dark:bg-slate-900"
                                loading={productsLoading}
                                disabled={!warehouseId}
                              />
                            )}
                          />
                        </div>

                        <div className="md:col-span-4 space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-400 ml-1 flex items-center tracking-wider">
                            <MapPin className="size-3 mr-1 text-slate-300" /> VỊ TRÍ
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
                                className="h-10 rounded-lg bg-white dark:bg-slate-900"
                                loading={locationsLoading}
                                disabled={!warehouseId}
                              />
                            )}
                          />
                        </div>

                        <div className="md:col-span-3 space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-400 ml-1 flex items-center tracking-wider">
                            <Tag className="size-3 mr-1 text-slate-300" /> SỐ LÔ
                          </Label>
                          <Input
                            {...register(`items.${index}.lotNumber`)}
                            placeholder="Không bắt buộc"
                            className="h-10 rounded-lg bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    ))}

                    {errors.items && (
                      <p className="text-xs text-rose-500 text-center font-medium">{errors.items.message}</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[11px] font-medium text-slate-500">
              {!warehouseId ? "Chọn kho trước khi thêm sản phẩm." : "Điền đầy đủ thông tin trước khi tạo."}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-lg px-5 hover:bg-slate-50"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 min-w-[150px] rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Đang khởi tạo…
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
