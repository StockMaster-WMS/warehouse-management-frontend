"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Info,
  Ruler,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCategoriesQuery } from "@/store/services/category.service";
import { CategoryTreeSelectItems } from "@/components/features/CategoryTreeSelectItems";

const nonNegativeNumericString = z
  .string()
  .optional()
  .refine((val) => !val || (!Number.isNaN(Number(val)) && Number(val) >= 0), {
    message: "Giá trị phải là số không âm.",
  });

const productSchema = z.object({
  barcode: z
    .string()
    .regex(/^(\d{8,13})?$/, "Mã vạch phải có từ 8 đến 13 chữ số.")
    .optional()
    .or(z.literal("")),
  name: z.string().trim().min(1, "Tên sản phẩm là bắt buộc."),
  category: z.string().min(1, "Vui lòng chọn nhóm hàng."),
  baseUnit: z.string().min(1, "Vui lòng chọn đơn vị tính."),
  lengthCm: nonNegativeNumericString,
  widthCm: nonNegativeNumericString,
  heightCm: nonNegativeNumericString,
  weightGram: nonNegativeNumericString,
  minStock: nonNegativeNumericString,
  maxStock: nonNegativeNumericString,
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      barcode: "",
      name: "",
      category: "",
      baseUnit: "cai",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      weightGram: "",
      minStock: "5",
      maxStock: "100",
    },
  });

  const [submitMessage, setSubmitMessage] = useState("");

  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    error: categoryError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const onValid = async (_data: ProductFormValues) => {
    setSubmitMessage("");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitMessage(
      "Đã lưu thông tin sản phẩm ở mức giao diện. Bước tiếp theo: kết nối API tạo sản phẩm.",
    );
    toast.success("Đã lưu bản nháp", {
      description: "Kết nối API tạo sản phẩm sẽ bật ở bước sau.",
    });
  };

  const onInvalid = () => {
    toast.error("Kiểm tra lại thông tin đã nhập.");
  };

  return (
    <div className="w-full space-y-6 pb-20">
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
            <ArrowLeft className="h-4 w-4" />
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
          {/* Section 1: Thông tin cơ bản */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Info className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin định danh
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="barcode"
                  className="text-xs font-bold text-slate-500 uppercase"
                >
                  Mã vạch (EAN/UPC)
                </label>
                <Input
                  id="barcode"
                  placeholder="0123456789012"
                  {...register("barcode")}
                  aria-invalid={!!errors.barcode}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.barcode?.message ? (
                  <p className="text-xs font-medium text-rose-600">{errors.barcode.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="product-name"
                  className="text-xs font-bold text-slate-500 uppercase"
                >
                  Tên sản phẩm <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="product-name"
                  placeholder="Nhập tên đầy đủ của mặt hàng..."
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.name?.message ? (
                  <p className="text-xs font-medium text-rose-600">{errors.name.message}</p>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-xs font-bold text-slate-500 uppercase">
                    Nhóm hàng
                  </label>
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
                  {errors.category?.message ? (
                    <p className="text-xs font-medium text-rose-600">{errors.category.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label htmlFor="base-unit" className="text-xs font-bold text-slate-500 uppercase">
                    Đơn vị tính
                  </label>
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
                  {errors.baseUnit?.message ? (
                    <p className="text-xs font-medium text-rose-600">{errors.baseUnit.message}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông số vận hành */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Ruler className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Quy cách & Vận chuyển
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <label
                  htmlFor="length-cm"
                  className="text-[10px] font-bold text-slate-500 uppercase"
                >
                  Dài (cm)
                </label>
                <Input
                  id="length-cm"
                  type="number"
                  placeholder="0"
                  {...register("lengthCm")}
                  aria-invalid={!!errors.lengthCm}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.lengthCm?.message ? (
                  <p className="text-[10px] font-medium text-rose-600">{errors.lengthCm.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="width-cm"
                  className="text-[10px] font-bold text-slate-500 uppercase"
                >
                  Rộng (cm)
                </label>
                <Input
                  id="width-cm"
                  type="number"
                  placeholder="0"
                  {...register("widthCm")}
                  aria-invalid={!!errors.widthCm}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.widthCm?.message ? (
                  <p className="text-[10px] font-medium text-rose-600">{errors.widthCm.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="height-cm"
                  className="text-[10px] font-bold text-slate-500 uppercase"
                >
                  Cao (cm)
                </label>
                <Input
                  id="height-cm"
                  type="number"
                  placeholder="0"
                  {...register("heightCm")}
                  aria-invalid={!!errors.heightCm}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.heightCm?.message ? (
                  <p className="text-[10px] font-medium text-rose-600">{errors.heightCm.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="weight-gram"
                  className="text-[10px] font-bold text-slate-500 uppercase"
                >
                  Nặng (gr)
                </label>
                <Input
                  id="weight-gram"
                  type="number"
                  placeholder="0"
                  {...register("weightGram")}
                  aria-invalid={!!errors.weightGram}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.weightGram?.message ? (
                  <p className="text-[10px] font-medium text-rose-600">{errors.weightGram.message}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phụ: Cấu hình tồn kho */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Ngưỡng báo động
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="min-stock"
                  className="text-xs font-bold text-slate-500 uppercase"
                >
                  Tồn tối thiểu
                </label>
                <Input
                  id="min-stock"
                  type="number"
                  {...register("minStock")}
                  aria-invalid={!!errors.minStock}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.minStock?.message ? (
                  <p className="text-[10px] font-medium text-rose-600">{errors.minStock.message}</p>
                ) : null}
                <p className="text-[10px] font-medium text-slate-400 italic">
                  Cảnh báo khi kho thấp hơn mức này.
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="max-stock"
                  className="text-xs font-bold text-slate-500 uppercase"
                >
                  Tồn tối đa
                </label>
                <Input
                  id="max-stock"
                  type="number"
                  {...register("maxStock")}
                  aria-invalid={!!errors.maxStock}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.maxStock?.message ? (
                  <p className="text-[10px] font-medium text-rose-600">{errors.maxStock.message}</p>
                ) : null}
                <p className="text-[10px] font-medium text-slate-400 italic">
                  Dùng để tính tỷ lệ lấp đầy kho.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-none"
              >
                <Save className="mr-2 h-4 w-4" />
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
