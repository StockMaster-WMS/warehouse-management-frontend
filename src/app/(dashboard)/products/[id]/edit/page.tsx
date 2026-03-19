"use client";

import { FormEvent, ReactNode, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Info, Ruler, Save } from "lucide-react";
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
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "@/store/services/product.service";
import { useGetCategoriesQuery } from "@/store/services/category.service";

type ProductFormValues = {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  baseUnit: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
  minStock: string;
  status: "ACTIVE" | "INACTIVE";
};

type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

const initialValues: ProductFormValues = {
  sku: "",
  barcode: "",
  name: "",
  category: "",
  baseUnit: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  weightKg: "",
  minStock: "",
  status: "ACTIVE",
};

export default function EditProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { id } = params;

  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitMessage, setSubmitMessage] = useState("");

  const { data, error, isLoading, isFetching, refetch } = useGetProductByIdQuery(id);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    error: categoryError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  useEffect(() => {
    if (!data?.data) return;
    const p = data.data;
    setValues({
      sku: p.sku ?? "",
      barcode: p.barcodeEan13 ?? "",
      name: p.name ?? "",
      category: p.categoryId ?? "",
      baseUnit: p.baseUnit ?? "",
      lengthCm: p.lengthCm != null ? String(p.lengthCm) : "",
      widthCm: p.widthCm != null ? String(p.widthCm) : "",
      heightCm: p.heightCm != null ? String(p.heightCm) : "",
      weightKg: p.weightKg != null ? String(p.weightKg) : "",
      minStock: p.minStockQty != null ? String(p.minStockQty) : "",
      status: p.status ?? "ACTIVE",
    });
  }, [data]);

  const isSaveDisabled = useMemo(
    () =>
      isUpdating ||
      isLoading ||
      !values.sku.trim() ||
      !values.name.trim() ||
      !values.category.trim() ||
      !values.baseUnit.trim(),
    [isUpdating, isLoading, values],
  );

  const validate = (form: ProductFormValues): ProductFormErrors => {
    const nextErrors: ProductFormErrors = {};
    if (!form.sku.trim()) nextErrors.sku = "SKU là bắt buộc.";
    if (!form.name.trim()) nextErrors.name = "Tên sản phẩm là bắt buộc.";
    if (!form.category.trim()) nextErrors.category = "Danh mục là bắt buộc.";
    if (!form.baseUnit.trim()) nextErrors.baseUnit = "Đơn vị tính là bắt buộc.";
    if (form.barcode && !/^\d{8,13}$/.test(form.barcode)) {
      nextErrors.barcode = "Barcode phải có từ 8 đến 13 chữ số.";
    }

    (["lengthCm", "widthCm", "heightCm", "weightKg", "minStock"] as const).forEach(
      (field) => {
        const raw = form[field];
        if (!raw) return;
        const n = Number(raw);
        if (Number.isNaN(n) || n < 0) {
          nextErrors[field] = "Giá trị phải là số không âm.";
        }
      },
    );

    return nextErrors;
  };

  const updateValue = (key: keyof ProductFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage("");
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await updateProduct({
        id,
        sku: values.sku.trim(),
        barcodeEan13: values.barcode.trim() || undefined,
        name: values.name.trim(),
        categoryId: values.category.trim(),
        baseUnit: values.baseUnit.trim(),
        weightKg: values.weightKg ? Number(values.weightKg) : null,
        lengthCm: values.lengthCm ? Number(values.lengthCm) : null,
        widthCm: values.widthCm ? Number(values.widthCm) : null,
        heightCm: values.heightCm ? Number(values.heightCm) : null,
        minStockQty: values.minStock ? Number(values.minStock) : null,
        status: values.status,
      }).unwrap();
      setSubmitMessage("Cập nhật sản phẩm thành công.");
    } catch (submitError) {
      const message =
        (submitError as { data?: { message?: string } })?.data?.message ??
        "Không thể cập nhật sản phẩm. Vui lòng thử lại.";
      setSubmitMessage(message);
    }
  };

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
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Chỉnh sửa sản phẩm"
        description={`Cập nhật thông tin cho sản phẩm ${data.data.sku}.`}
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

      <form className="grid grid-cols-1 gap-6 md:grid-cols-3" onSubmit={handleSubmit} noValidate>
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Info className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin định danh
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mã SKU *" htmlFor="sku" error={errors.sku}>
                  <Input id="sku" value={values.sku} onChange={(e) => updateValue("sku", e.target.value)} />
                </Field>
                <Field label="Barcode" htmlFor="barcode" error={errors.barcode}>
                  <Input id="barcode" value={values.barcode} onChange={(e) => updateValue("barcode", e.target.value)} />
                </Field>
              </div>
              <Field label="Tên sản phẩm *" htmlFor="name" error={errors.name}>
                <Input id="name" value={values.name} onChange={(e) => updateValue("name", e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Danh mục *" htmlFor="category" error={errors.category}>
                  <Select
                    value={values.category}
                    onValueChange={(v) => updateValue("category", v ?? "")}
                  >
                    <SelectTrigger id="category">
                      <SelectValue
                        placeholder={
                          isLoadingCategories
                            ? "Đang tải danh mục..."
                            : categoryError
                              ? "Lỗi tải danh mục"
                              : "Chọn danh mục"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryError ? (
                        <div className="px-2 py-1.5 text-xs text-rose-500">
                          Không tải được danh mục.
                          <button
                            type="button"
                            onClick={() => refetchCategories()}
                            className="ml-1 underline"
                          >
                            Thử lại
                          </button>
                        </div>
                      ) : null}
                      {categoryData?.data?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Đơn vị tính *" htmlFor="base-unit" error={errors.baseUnit}>
                  <Select value={values.baseUnit} onValueChange={(v) => updateValue("baseUnit", v ?? "")}>
                    <SelectTrigger id="base-unit">
                      <SelectValue placeholder="Chọn đơn vị tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cai">Cái / Chiếc</SelectItem>
                      <SelectItem value="hop">Hộp</SelectItem>
                      <SelectItem value="thung">Thùng</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Ruler className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Quy cách vận hành
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Dài (cm)" htmlFor="length" error={errors.lengthCm}>
                <Input id="length" type="number" value={values.lengthCm} onChange={(e) => updateValue("lengthCm", e.target.value)} />
              </Field>
              <Field label="Rộng (cm)" htmlFor="width" error={errors.widthCm}>
                <Input id="width" type="number" value={values.widthCm} onChange={(e) => updateValue("widthCm", e.target.value)} />
              </Field>
              <Field label="Cao (cm)" htmlFor="height" error={errors.heightCm}>
                <Input id="height" type="number" value={values.heightCm} onChange={(e) => updateValue("heightCm", e.target.value)} />
              </Field>
              <Field label="Nặng (kg)" htmlFor="weight" error={errors.weightKg}>
                <Input id="weight" type="number" value={values.weightKg} onChange={(e) => updateValue("weightKg", e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Trạng thái & ngưỡng
            </h3>
            <div className="space-y-4">
              <Field label="Tồn tối thiểu" htmlFor="min-stock" error={errors.minStock}>
                <Input id="min-stock" type="number" value={values.minStock} onChange={(e) => updateValue("minStock", e.target.value)} />
              </Field>
              <Field label="Trạng thái" htmlFor="status" error={errors.status}>
                <Select
                  value={values.status}
                  onValueChange={(v) => updateValue("status", (v as "ACTIVE" | "INACTIVE") ?? "ACTIVE")}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button type="submit" disabled={isSaveDisabled} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70">
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "Đang lưu..." : "Lưu cập nhật"}
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
