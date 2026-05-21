"use client";

import {
  ArrowLeft,
  Save,
  Info,
  Ruler,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { ProductFormField, useProductCreateForm } from "@/components/features/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryTreeSelectItems } from "@/components/features/CategoryTreeSelectItems";
import { Controller } from "react-hook-form";
import { Switch } from "@/components/ui/switch";

export default function NewProductPage() {
  const {
    register,
    handleSubmit,
    control,
    formState,
    submitMessage,
    onValid,
    onInvalid,
    categoryData,
    isLoadingCategories,
    categoryError,
    refetchCategories,
    supplierData,
    isLoadingSuppliers,
  } = useProductCreateForm();

  const { errors, isSubmitting } = formState;

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-20">
      <PageHeader
        title="Tạo sản phẩm mới"
        description="Thiết lập thông tin định danh và cấu hình vận hành cho mặt hàng mới."
        actions={
          <Button
            render={<Link href="/products" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="size-4" />
          </Button>
        }
      />

      {submitMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          {submitMessage}
        </div>
      ) : null}

      <form className="grid grid-cols-1 gap-6 md:grid-cols-3" onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
        <div className="md:col-span-2 space-y-6">
          {/* Khối 1: Thông tin định danh */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Info className="size-4 text-indigo-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin định danh
              </h3>
            </div>
            <div className="space-y-4">
                <ProductFormField label="Mã vạch (EAN/UPC)" htmlFor="barcode" error={errors.barcode?.message}>
                <Input
                  id="barcode"
                  placeholder="0123456789012"
                  {...register("barcode")}
                  aria-invalid={!!errors.barcode}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                </ProductFormField>
                <ProductFormField label="Tên sản phẩm *" htmlFor="product-name" error={errors.name?.message}>
                <Input
                  id="product-name"
                  placeholder="Nhập tên đầy đủ của mặt hàng..."
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                </ProductFormField>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProductFormField label="Nhóm hàng" htmlFor="category" error={errors.category?.message}>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="category"
                          aria-invalid={!!errors.category}
                          className="h-auto min-h-10 w-full min-w-0 border-slate-200 bg-slate-50/50 py-2 focus:ring-indigo-500/30"
                        >
                          <SelectValue
                            placeholder={
                              isLoadingCategories
                                ? "Đang tải nhóm hàng..."
                                : categoryError
                                  ? "Lỗi tải nhóm hàng"
                                  : "Chọn nhóm hàng..."
                            }
                          >
                            {(val) => {
                              if (!val) return null;
                              const c = categoryData?.data?.content?.find((x) => x.id === val);
                              return c ? `${c.name} (${c.code})` : "Đang tải tên nhóm…";
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {categoryError ? (
                            <div className="px-2 py-1.5 text-xs text-rose-500">
                              Không tải được nhóm hàng.
                              <button
                                type="button"
                                onClick={() => refetchCategories()}
                                className="ml-1 underline"
                              >
                                Thử lại
                              </button>
                            </div>
                          ) : null}
                          {categoryData?.data?.content?.length ? (
                            <CategoryTreeSelectItems categories={categoryData.data.content} />
                          ) : null}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </ProductFormField>
                <ProductFormField label="Nhà cung cấp" htmlFor="supplier" error={errors.supplierId?.message}>
                  <Controller
                    name="supplierId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="supplier"
                          className="h-auto min-h-10 w-full border-slate-200 bg-slate-50/50 py-2 focus:ring-indigo-500/30"
                        >
                          <SelectValue
                            placeholder={
                              isLoadingSuppliers
                                ? "Đang tải nhà cung cấp..."
                                : "Chọn nhà cung cấp..."
                            }
                          >
                            {(val) => {
                                if (!val) return null;
                                const s = supplierData?.data?.content?.find((x) => x.id === val);
                                return s ? s.name : "Đang tải tên...";
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {supplierData?.data?.content?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </ProductFormField>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4">
                <ProductFormField label="Đơn vị tính" htmlFor="base-unit" error={errors.baseUnit?.message}>
                  <Controller
                    name="baseUnit"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="base-unit"
                          aria-invalid={!!errors.baseUnit}
                          className="h-auto min-h-10 w-full min-w-0 border-slate-200 bg-slate-50/50 py-2 focus:ring-indigo-500/30"
                        >
                          <SelectValue placeholder="Chọn ĐVT...">
                            {(val) => {
                              if (!val) return null;
                              const map: Record<string, string> = {
                                cai: "Cái / Chiếc",
                                hop: "Hộp",
                                thung: "Thùng",
                              };
                              return map[val] ?? val;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          <SelectItem value="cai">Cái / Chiếc</SelectItem>
                          <SelectItem value="thung">Thùng</SelectItem>
                          <SelectItem value="hop">Hộp</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </ProductFormField>
              </div>
            </div>
          </div>

          {/* Khối 2: Quy cách và cấu hình */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Ruler className="size-4 text-indigo-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Quy cách & Vận chuyển
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProductFormField label="Nặng (kg)" htmlFor="weight-kg" error={errors.weightKg?.message}>
                <Input
                  id="weight-kg"
                  type="number"
                  step="any"
                  placeholder="0"
                  {...register("weightKg")}
                  aria-invalid={!!errors.weightKg}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
              <ProductFormField label="Thể tích (cm³)" htmlFor="volume-cm3" error={errors.volumeCm3?.message}>
                <Input
                  id="volume-cm3"
                  type="number"
                  step="any"
                  placeholder="0"
                  {...register("volumeCm3")}
                  aria-invalid={!!errors.volumeCm3}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Controller
                name="isLotTracked"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <span className="text-sm text-slate-700">Theo dõi lô</span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
              <Controller
                name="isExpiryTracked"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <span className="text-sm text-slate-700">Theo dõi hạn dùng</span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
              <Controller
                name="isFrozen"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <span className="text-sm text-slate-700">Hàng đông lạnh</span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
              <Controller
                name="isFragile"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <span className="text-sm text-slate-700">Dễ vỡ</span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
              <Controller
                name="isHazmat"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <span className="text-sm text-slate-700">Hàng nguy hiểm</span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
              <Controller
                name="isHeavy"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                    <span className="text-sm text-slate-700">Hàng nặng</span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Cột phụ: Ngưỡng tồn kho và hành động lưu */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <AlertCircle className="size-4 text-amber-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Ngưỡng báo động
              </h3>
            </div>
            <div className="space-y-4">
              <ProductFormField label="Tồn tối thiểu" htmlFor="min-stock" error={errors.minStock?.message}>
                <Input
                  id="min-stock"
                  type="number"
                  {...register("minStock")}
                  aria-invalid={!!errors.minStock}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                <p className="text-[10px] font-medium text-slate-400 italic">
                  Cảnh báo khi kho thấp hơn mức này.
                </p>
              </ProductFormField>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-none"
              >
                <Save className="mr-2 size-4" />
                {isSubmitting ? "Đang lưu..." : "Lưu sản phẩm"}
              </Button>
              <Button
                render={<Link href="/products" />}
                nativeButton={false}
                variant="outline"
                className="w-full border-slate-200 bg-white"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
