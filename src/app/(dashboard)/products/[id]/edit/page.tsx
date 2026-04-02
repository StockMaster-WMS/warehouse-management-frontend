"use client";

import { use, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Info, Ruler, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryTreeSelectItems } from "@/components/features/CategoryTreeSelectItems";
import { useProductEditForm } from "@/components/features/products";
import { getProductCategoryDisplayName } from "@/lib/product-display";
import { AlertCircle } from "lucide-react";
import { Controller } from "react-hook-form";
import { ProductFormField } from "@/components/features/products/components/ProductFormField";

export default function EditProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { id } = params;

  const {
    register,
    handleSubmit,
    control,
      formState,
    submitMessage,
    data,
    error,
    isLoading,
    isFetching,
    refetch,
    categoryData,
    isLoadingCategories,
    categoryError,
    refetchCategories,
    onValid,
    onInvalid,
  } = useProductEditForm(id);

    const { errors, isSubmitting } = formState;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        <EmptyState
          icon={AlertCircle}
          title="Không thể tải thông tin để chỉnh sửa"
          description={
            (error as { data?: { message?: string } })?.data?.message ??
            "Không tìm thấy dữ liệu sản phẩm."
          }
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-20">
      <PageHeader
        title="Chỉnh sửa sản phẩm"
        description={`SKU ${data.data.sku} · ${data.data.name}`}
        actions={
          <Button
            render={<Link href={`/products/${id}`} />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      {isFetching ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
          Đang đồng bộ dữ liệu...
        </p>
      ) : null}

      {submitMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          {submitMessage}
        </div>
      ) : null}

      <form className="grid grid-cols-1 gap-6 md:grid-cols-3" onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
        <div className="space-y-6 md:col-span-2">
          {/* Khối 1: Thông tin định danh */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Info className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
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
                  className="border-slate-200 bg-slate-50/50 font-mono text-sm focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
              <ProductFormField label="Tên sản phẩm *" htmlFor="name" error={errors.name?.message}>
                <Input
                  id="name"
                  placeholder="Nhập tên đầy đủ của mặt hàng..."
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProductFormField label="Nhóm hàng *" htmlFor="category" error={errors.category?.message}>
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
                              if (c) return `${c.name} (${c.code})`;
                              if (data?.data && val === data.data.categoryId) {
                                const n = getProductCategoryDisplayName(data.data);
                                if (n) return `${n}`;
                              }
                              return "Đang tải nhóm hàng…";
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
                <ProductFormField label="Đơn vị tính (ĐVT) *" htmlFor="base-unit" error={errors.baseUnit?.message}>
                  <Input
                    id="base-unit"
                    placeholder="VD: goi, thung, kg..."
                    {...register("baseUnit")}
                    aria-invalid={!!errors.baseUnit}
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                </ProductFormField>
              </div>
            </div>
          </div>

          {/* Khối 2: Quy cách và kích thước */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Ruler className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Quy cách & Vận chuyển
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ProductFormField label="Dài (cm)" htmlFor="length" error={errors.lengthCm?.message}>
                <Input
                  id="length"
                  type="number"
                  placeholder="0"
                  {...register("lengthCm")}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
              <ProductFormField label="Rộng (cm)" htmlFor="width" error={errors.widthCm?.message}>
                <Input
                  id="width"
                  type="number"
                  placeholder="0"
                  {...register("widthCm")}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
              <ProductFormField label="Cao (cm)" htmlFor="height" error={errors.heightCm?.message}>
                <Input
                  id="height"
                  type="number"
                  placeholder="0"
                  {...register("heightCm")}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
              <ProductFormField label="Nặng (kg)" htmlFor="weight" error={errors.weightKg?.message}>
                <Input
                  id="weight"
                  type="number"
                  placeholder="0"
                  {...register("weightKg")}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
            </div>
          </div>
        </div>

        {/* Cột phụ: Trạng thái, ngưỡng tồn và nút lưu */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Trạng thái & ngưỡng
            </h3>
            <div className="space-y-4">
              <ProductFormField label="Tồn tối thiểu" htmlFor="min-stock" error={errors.minStock?.message}>
                <Input
                  id="min-stock"
                  type="number"
                  placeholder="0"
                  {...register("minStock")}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </ProductFormField>
              <ProductFormField label="Trạng thái" htmlFor="status" error={errors.status?.message}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="status"
                        className="h-auto min-h-10 w-full min-w-0 border-slate-200 bg-slate-50/50 py-2 focus:ring-indigo-500/30"
                      >
                        <SelectValue>
                          {(val) =>
                            val === "INACTIVE" ? "Ngưng" : val === "ACTIVE" ? "Hoạt động" : null
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">Ngưng</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </ProductFormField>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Đang lưu..." : "Lưu cập nhật"}
              </Button>
              <Button render={<Link href={`/products/${id}`} />} nativeButton={false} variant="outline" className="w-full border-slate-200 bg-white">
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-xs font-bold uppercase text-slate-500">
        {label}
      </label>
      {children}
      {error ? <p className="text-[11px] font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
