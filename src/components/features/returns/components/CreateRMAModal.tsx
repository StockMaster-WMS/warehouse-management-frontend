"use client";

import { ClipboardList, Loader2, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useGetCustomersQuery } from "@/store/services/customer.service";
import { useGetLocationsListQuery } from "@/store/services/location.service";
import { useGetProductsQuery } from "@/store/services/product.service";
import {
  useCreateReturnRequestMutation,
  useGetReturnableReceiptDetailsQuery,
  useGetReturnableReceiptsByCustomerQuery,
} from "@/store/services/return.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { apiErrMessage } from "@/types/api";
import type { Customer } from "@/types/customer";
import type { CreateReturnRequestPayload, ReturnType } from "@/types/returns";

interface CreateRMAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RETURN_TYPE_LABEL: Record<ReturnType, string> = {
  CUSTOMER: "Khách trả hàng",
  SUPPLIER: "Trả nhà cung cấp",
};

const REASON_OPTIONS = [
  "Khách trả hàng",
  "Hàng lỗi",
  "Sai hàng",
  "Hàng hết hạn",
  "Kiểm tra chất lượng",
  "Trả nhà cung cấp",
];

const DEFAULT_VALUES: CreateReturnRequestPayload = {
  returnType: "CUSTOMER",
  customerId: "",
  customerName: "",
  salesOrderId: "",
  supplierId: "",
  warehouseId: "",
  reason: "Khách trả hàng",
  lines: [],
  note: "",
};

function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

export function CreateRMAModal({ open, onOpenChange }: CreateRMAModalProps) {
  const [createRMA, { isLoading: isCreating }] = useCreateReturnRequestMutation();
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const debouncedCustomerKeyword = useDebouncedValue(customerSearch.trim());

  const { data: customersRes, isLoading: isLoadingCustomers, isFetching: isFetchingCustomers } = useGetCustomersQuery({
    page: 0,
    size: 20,
    sort: "name",
    sortDir: "asc",
    keyword: debouncedCustomerKeyword || undefined,
    isActive: true,
  });
  const { data: warehousesRes, isLoading: isLoadingWarehouses } = useGetWarehousesQuery({ page: 0, size: 100 });
  const { data: productsRes, isLoading: isLoadingProducts } = useGetProductsQuery({ page: 0, size: 200 });
  const { data: suppliersRes, isLoading: isLoadingSuppliers } = useGetSuppliersQuery({ page: 0, size: 200 });

  const form = useForm<CreateReturnRequestPayload>({ defaultValues: DEFAULT_VALUES });
  const returnType = useWatch({ control: form.control, name: "returnType" }) as ReturnType;
  const customerId = useWatch({ control: form.control, name: "customerId" });
  const salesOrderId = useWatch({ control: form.control, name: "salesOrderId" });
  const warehouseId = useWatch({ control: form.control, name: "warehouseId" });
  const supplierId = useWatch({ control: form.control, name: "supplierId" });
  const lines = useWatch({ control: form.control, name: "lines" }) ?? [];

  const currentCustomer =
    customersRes?.data?.content?.find((customer) => customer.id === customerId) ??
    (selectedCustomer?.id === customerId ? selectedCustomer : null);
  const selectedWarehouse = warehousesRes?.data?.content?.find((warehouse) => warehouse.id === warehouseId);
  const selectedSupplier = suppliersRes?.data?.content?.find((supplier) => supplier.id === supplierId);

  const { data: receiptsRes, isLoading: isLoadingReceipts } = useGetReturnableReceiptsByCustomerQuery(customerId ?? "", {
    skip: returnType !== "CUSTOMER" || !customerId,
  });

  const { data: receiptDetailsRes, isLoading: isLoadingReceiptDetails } = useGetReturnableReceiptDetailsQuery(salesOrderId ?? "", {
    skip: returnType !== "CUSTOMER" || !salesOrderId,
  });

  const { data: locationsRes, isLoading: isLoadingLocations } = useGetLocationsListQuery(
    { page: 0, size: 300, warehouseId },
    { skip: returnType !== "SUPPLIER" || !warehouseId },
  );

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const customerOptions = useMemo(
    () => {
      const customers = customersRes?.data?.content ?? [];
      const optionCustomers =
        selectedCustomer && !customers.some((customer) => customer.id === selectedCustomer.id)
          ? [selectedCustomer, ...customers]
          : customers;

      return optionCustomers.map((customer) => ({
        value: customer.id,
        label: customer.name,
        hint: [customer.code, customer.phone, customer.email].filter(Boolean).join(" · "),
      }));
    },
    [customersRes, selectedCustomer],
  );

  const receiptOptions = useMemo(
    () =>
      (receiptsRes?.data ?? [])
        .filter((receipt) => Number(receipt.totalReturnableQty ?? 0) > 0)
        .map((receipt) => ({
          value: receipt.id,
          label: receipt.soNumber,
          hint: `Đã giao ${formatNumber(receipt.totalShippedQty)} · Còn trả ${formatNumber(receipt.totalReturnableQty)}`,
        })),
    [receiptsRes],
  );

  const productOptions = useMemo(
    () =>
      (productsRes?.data?.content ?? []).map((product) => ({
        value: product.id,
        label: `${product.sku} - ${product.name}`,
        hint: product.categoryName ?? undefined,
      })),
    [productsRes],
  );

  const locationOptions = useMemo(
    () =>
      (locationsRes?.data?.content ?? []).map((location) => ({
        value: location.id,
        label: location.code,
        hint: [location.zone, location.aisle, location.rack].filter(Boolean).join(" · "),
      })),
    [locationsRes],
  );

  useEffect(() => {
    if (returnType !== "CUSTOMER" || !currentCustomer) return;
    form.setValue("customerName", currentCustomer.name);
  }, [currentCustomer, form, returnType]);

  useEffect(() => {
    if (returnType !== "CUSTOMER" || !receiptDetailsRes?.data) return;
    const detail = receiptDetailsRes.data;
    form.setValue("warehouseId", detail.warehouseId);
    form.setValue("customerId", customerId || detail.customerId || "");
    form.setValue("customerName", detail.customerName || currentCustomer?.name || "");
    replace(
      detail.items
        .filter((item) => Number(item.returnableQty ?? 0) > 0)
        .map((item) => ({
          productId: item.productId,
          salesOrderItemId: item.salesOrderItemId,
          expectedQty: Number(item.returnableQty ?? 0),
          lotNumber: "",
          shippedQty: Number(item.shippedQty ?? 0),
          alreadyReturnedQty: Number(item.alreadyReturnedQty ?? 0),
          returnableQty: Number(item.returnableQty ?? 0),
        })),
    );
  }, [currentCustomer, customerId, form, receiptDetailsRes, replace, returnType]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset(DEFAULT_VALUES);
    if (!nextOpen) {
      setCustomerSearch("");
      setSelectedCustomer(null);
    }
    onOpenChange(nextOpen);
  };

  const setReturnType = (nextType: ReturnType) => {
    setCustomerSearch("");
    setSelectedCustomer(null);
    form.reset({
      ...DEFAULT_VALUES,
      returnType: nextType,
      reason: nextType === "SUPPLIER" ? "Trả nhà cung cấp" : "Khách trả hàng",
      lines: nextType === "SUPPLIER" ? [{ productId: "", expectedQty: 1, lotNumber: "", locationId: "" }] : [],
    });
  };

  const handleCustomerChange = (nextCustomerId: string) => {
    form.setValue("customerId", nextCustomerId);
    form.setValue("salesOrderId", "");
    form.setValue("warehouseId", "");
    const nextCustomer =
      customersRes?.data?.content?.find((customer) => customer.id === nextCustomerId) ??
      (selectedCustomer?.id === nextCustomerId ? selectedCustomer : null);
    setSelectedCustomer(nextCustomer);
    form.setValue("customerName", nextCustomer?.name ?? "");
    replace([]);
  };

  const validateCustomerReturn = (data: CreateReturnRequestPayload) => {
    if (!data.customerId) return "Vui lòng chọn khách hàng";
    if (!data.salesOrderId) return "Vui lòng chọn đơn xuất liên quan";
    if (!data.warehouseId) return "Không xác định được kho từ đơn xuất";
    if (data.lines.length === 0) return "Đơn xuất đã chọn không còn sản phẩm có thể trả";

    const invalidLine = data.lines.find((line) => !line.productId || Number(line.expectedQty) <= 0);
    if (invalidLine) return "Vui lòng chọn sản phẩm và nhập số lượng trả lớn hơn 0";

    const overReturnLine = data.lines.find(
      (line) =>
        line.salesOrderItemId &&
        typeof line.returnableQty === "number" &&
        Number(line.expectedQty) > Number(line.returnableQty),
    );
    if (overReturnLine) return "Số lượng trả không được vượt quá số lượng còn có thể trả";

    return null;
  };

  const onSubmit = async (data: CreateReturnRequestPayload) => {
    try {
      if (!data.reason?.trim()) return toast.error("Vui lòng nhập lý do trả hàng");

      if (data.returnType === "CUSTOMER") {
        const message = validateCustomerReturn(data);
        if (message) return toast.error(message);
      }

      if (data.returnType === "SUPPLIER") {
        if (!data.warehouseId) return toast.error("Vui lòng chọn kho xuất trả");
        if (!data.supplierId) return toast.error("Vui lòng chọn nhà cung cấp");
        if (data.lines.some((line) => !line.productId)) return toast.error("Vui lòng chọn sản phẩm");
        if (data.lines.some((line) => Number(line.expectedQty) <= 0)) return toast.error("Số lượng dự kiến phải lớn hơn 0");
        if (data.lines.some((line) => !line.locationId)) return toast.error("Phiếu trả NCC cần chọn vị trí xuất trả cho từng dòng");
      }

      await createRMA({
        ...data,
        customerName: data.customerName?.trim(),
        reason: data.reason.trim(),
        lines: data.lines.map((line) => ({
          ...line,
          expectedQty: Number(line.expectedQty),
          salesOrderItemId: line.salesOrderItemId || undefined,
          lotNumber: line.lotNumber?.trim() || "",
          locationId: line.locationId || undefined,
        })),
      }).unwrap();

      toast.success("Đã tạo phiếu trả hàng thành công");
      form.reset(DEFAULT_VALUES);
      handleOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo phiếu trả hàng"));
    }
  };

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
                <DialogTitle>Tạo phiếu trả hàng</DialogTitle>
                <DialogDescription>
                  Chọn loại phiếu, thông tin liên quan và danh sách hàng trả.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-h-[calc(92vh-5rem)] flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-6 dark:bg-slate-950/30">
            <div className="space-y-5">
              <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loại phiếu</Label>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {(["CUSTOMER", "SUPPLIER"] as ReturnType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setReturnType(type)}
                        className={cn(
                          "min-h-24 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20",
                          returnType === type
                            ? "border-indigo-200 bg-indigo-50 text-indigo-900 shadow-sm"
                            : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/40",
                        )}
                      >
                        <div className="font-semibold">{RETURN_TYPE_LABEL[type]}</div>
                        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {type === "CUSTOMER"
                            ? "Tạo từ đơn xuất đã giao của khách hàng."
                            : "Xuất trả hàng về nhà cung cấp."}
                        </div>
                      </button>
                    ))}
                  </div>
              </section>

              <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <h3 className="text-sm font-semibold">Thông tin phiếu</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Các trường bắt buộc theo từng loại trả hàng.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                  {returnType === "CUSTOMER" ? (
                    <>
                      <div className="space-y-2">
                        <Label>Khách hàng</Label>
                        <Controller
                          name="customerId"
                          control={form.control}
                          render={({ field }) => (
                            <SearchableSelect
                              value={field.value ?? ""}
                              onValueChange={handleCustomerChange}
                              options={customerOptions}
                              loading={isLoadingCustomers || isFetchingCustomers}
                              placeholder="Chọn khách hàng"
                              searchPlaceholder="Tìm theo tên, mã, SĐT..."
                              emptyText="Không tìm thấy khách hàng"
                              dialogTitle="Chọn khách hàng trả hàng"
                              serverSearch
                              searchQuery={customerSearch}
                              onSearchChange={setCustomerSearch}
                            />
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Đơn xuất liên quan</Label>
                        <Controller
                          name="salesOrderId"
                          control={form.control}
                          render={({ field }) => (
                            <SearchableSelect
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              options={receiptOptions}
                              loading={isLoadingReceipts}
                              disabled={!customerId}
                              placeholder={customerId ? "Chọn đơn xuất đã giao" : "Chọn khách hàng trước"}
                              searchPlaceholder="Tìm theo mã đơn xuất..."
                              emptyText="Khách hàng này chưa có đơn xuất còn hàng có thể trả"
                              dialogTitle="Chọn đơn xuất đã giao"
                            />
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Kho nhận hàng</Label>
                        <div className="flex min-h-12 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-muted-foreground">
                          {isLoadingReceiptDetails
                            ? "Đang tải kho từ đơn xuất..."
                            : selectedWarehouse
                              ? `${selectedWarehouse.name}${selectedWarehouse.code ? ` (${selectedWarehouse.code})` : ""}`
                              : "Tự động lấy theo đơn xuất"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Kho xuất trả</Label>
                        <Controller
                          name="warehouseId"
                          control={form.control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger>
                                <span className={cn("truncate text-sm", !selectedWarehouse && "text-muted-foreground")}>
                                  {isLoadingWarehouses
                                    ? "Đang tải kho..."
                                    : selectedWarehouse
                                      ? `${selectedWarehouse.name}${selectedWarehouse.code ? ` (${selectedWarehouse.code})` : ""}`
                                      : "Chọn kho"}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {warehousesRes?.data?.content?.filter((warehouse) => warehouse.id).map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id!}>
                                    {warehouse.name}{warehouse.code ? ` (${warehouse.code})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Nhà cung cấp</Label>
                        <Controller
                          name="supplierId"
                          control={form.control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger>
                                <span className={cn("truncate text-sm", !selectedSupplier && "text-muted-foreground")}>
                                  {isLoadingSuppliers
                                    ? "Đang tải nhà cung cấp..."
                                    : selectedSupplier
                                      ? selectedSupplier.name
                                      : "Chọn nhà cung cấp"}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {suppliersRes?.data?.content?.filter((supplier) => supplier.id).map((supplier) => (
                                  <SelectItem key={supplier.id} value={supplier.id!}>{supplier.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </>
                  )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Lý do trả hàng</Label>
                    <Input list="rma-reasons" placeholder="Ví dụ: Hàng lỗi / Khách đổi trả" {...form.register("reason")} />
                    <datalist id="rma-reasons">
                      {REASON_OPTIONS.map((reason) => (
                        <option key={reason} value={reason} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Textarea placeholder="Chi tiết về tình trạng hàng..." {...form.register("note")} className="min-h-24 resize-none" />
                  </div>
                  </div>
              </section>

              <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-semibold">Danh sách sản phẩm</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {returnType === "CUSTOMER"
                        ? "Dòng lấy từ đơn xuất được giới hạn theo số lượng còn có thể trả."
                        : "Chọn sản phẩm, số lượng và vị trí xuất trả cho từng dòng."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-lg border-indigo-200 bg-indigo-50/50 font-semibold text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"
                    onClick={() => append({ productId: "", expectedQty: 1, lotNumber: "", locationId: "" })}
                    disabled={returnType === "CUSTOMER" && !salesOrderId}
                  >
                    <Plus className="mr-2 size-4" />
                    {returnType === "CUSTOMER" ? "Thêm ngoài đơn" : "Thêm dòng"}
                  </Button>
                </div>

                <div className="p-4">
                  {returnType === "CUSTOMER" && !salesOrderId ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Chọn khách hàng và đơn xuất liên quan để tải danh sách hàng có thể trả.
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const line = lines[index];
                      const fromOrder = Boolean(line?.salesOrderItemId);
                      const returnableQty = Number(line?.returnableQty ?? 0);
                      const orderItem = receiptDetailsRes?.data?.items.find((item) => item.salesOrderItemId === line?.salesOrderItemId);

                      return (
                        <div key={field.id} className="group relative rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
                          <div className="grid gap-4 md:grid-cols-12">
                            <div className="space-y-2 md:col-span-5">
                              <Label className="text-xs">Sản phẩm</Label>
                              {fromOrder ? (
                                <div className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                  <div className="font-medium">{orderItem?.productName ?? "Sản phẩm từ đơn xuất"}</div>
                                  <div className="mt-0.5 text-xs text-muted-foreground">{orderItem?.productSku ?? line.productId}</div>
                                </div>
                              ) : (
                                <Controller
                                  name={`lines.${index}.productId`}
                                  control={form.control}
                                  render={({ field: subField }) => (
                                    <SearchableSelect
                                      value={subField.value || ""}
                                      onValueChange={subField.onChange}
                                      options={productOptions}
                                      loading={isLoadingProducts}
                                      placeholder="Chọn sản phẩm"
                                      dialogTitle="Chọn sản phẩm trả hàng"
                                    />
                                  )}
                                />
                              )}
                            </div>

                            {returnType === "CUSTOMER" && fromOrder ? (
                              <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs md:col-span-3">
                                <div>
                                  <div className="text-muted-foreground">Đã giao</div>
                                  <strong>{formatNumber(line.shippedQty)}</strong>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Đã trả</div>
                                  <strong>{formatNumber(line.alreadyReturnedQty)}</strong>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Còn trả</div>
                                  <strong className="text-emerald-700">{formatNumber(line.returnableQty)}</strong>
                                </div>
                              </div>
                            ) : returnType === "SUPPLIER" ? (
                              <div className="space-y-2 md:col-span-3">
                                <Label className="text-xs">Vị trí xuất trả</Label>
                                <Controller
                                  name={`lines.${index}.locationId`}
                                  control={form.control}
                                  render={({ field: subField }) => (
                                    <SearchableSelect
                                      value={subField.value || ""}
                                      onValueChange={subField.onChange}
                                      options={locationOptions}
                                      loading={isLoadingLocations}
                                      disabled={!warehouseId}
                                      placeholder="Chọn vị trí"
                                      dialogTitle="Chọn vị trí xuất trả"
                                    />
                                  )}
                                />
                              </div>
                            ) : (
                              <div className="hidden md:col-span-3 md:block" />
                            )}

                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-xs">SL trả</Label>
                              <Input
                                type="number"
                                min={1}
                                max={fromOrder ? returnableQty : undefined}
                                className="h-10 rounded-lg bg-white"
                                {...form.register(`lines.${index}.expectedQty`, { valueAsNumber: true })}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-1">
                              <Label className="text-xs">Số lô</Label>
                              <Input className="bg-white" placeholder="Không bắt buộc" {...form.register(`lines.${index}.lotNumber`)} />
                            </div>

                            <div className="flex items-end justify-end md:col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-rose-500"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1 && returnType === "SUPPLIER"}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 flex min-h-[76px] shrink-0 items-center justify-end gap-3 rounded-none border-t border-slate-200 bg-white px-6 pb-6 pt-4 dark:border-slate-800 dark:bg-slate-900">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={isCreating || isLoadingReceiptDetails} className="h-10 min-w-[170px] rounded-lg bg-indigo-600 font-semibold hover:bg-indigo-700">
              {isCreating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Package className="mr-2 size-4" />}
              Tạo phiếu trả hàng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
