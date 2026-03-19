"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Save, Tag } from "lucide-react";
import Link from "next/link";

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
import { useGetCategoriesQuery, useCreateCategoryMutation } from "@/store/services/category.service";

type CategoryFormValues = {
  name: string;
  parentId: string; // "" => root
  isActive: boolean;
};

type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, string>>;

export default function NewCategoryPage() {
  const [values, setValues] = useState<CategoryFormValues>({
    name: "",
    parentId: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [submitMessage, setSubmitMessage] = useState("");

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const categories = categoriesData?.data ?? [];

  const categoriesById = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c] as const));
  }, [categories]);

  const parentCategory = values.parentId
    ? categoriesById.get(values.parentId) ?? null
    : null;

  const computedLevel = useMemo(() => {
    if (!parentCategory) return 0;
    return (parentCategory.level ?? 0) + 1;
  }, [parentCategory]);

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();

  const isSaveDisabled = useMemo(() => {
    return isCreating || !values.name.trim();
  }, [isCreating, values.name]);

  const validate = (form: CategoryFormValues): CategoryFormErrors => {
    const nextErrors: CategoryFormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Tên nhóm hàng là bắt buộc.";
    return nextErrors;
  };

  const updateValue = <K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) => {
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
      await createCategory({
        name: values.name.trim(),
        parentId: values.parentId ? values.parentId : null,
        isActive: values.isActive,
      }).unwrap();

      setSubmitMessage("Tạo nhóm hàng thành công.");
      setValues({ name: "", parentId: "", isActive: true });
    } catch (submitError) {
      setSubmitMessage(
        (submitError as { data?: { message?: string } })?.data?.message ??
          "Không thể tạo nhóm hàng. Vui lòng thử lại.",
      );
    }
  };

  const formatOptionLabel = (cat: (typeof categories)[number]) => {
    const depth = typeof cat.level === "number" ? cat.level : 0;
    const safeDepth = Math.max(0, Math.min(depth, 8));
    const prefix = safeDepth > 0 ? `${"-".repeat(safeDepth)} ` : "";
    return `${prefix}${cat.name} (${cat.code})`;
  };

  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Thêm nhóm hàng"
        description="Tạo danh mục mới để phân loại và quản lý sản phẩm."
        actions={
          <Button
            render={<Link href="/categories" />}
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

      <form
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Tag className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin cơ bản phân loại
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-xs font-bold text-slate-500 uppercase"
                >
                  Tên nhóm / Phân loại <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Điện thoại, Tivi, Tủ Lạnh..."
                  value={values.name}
                  onChange={(event) => updateValue("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30 font-bold"
                />
                {errors.name ? (
                  <p className="text-xs font-medium text-rose-600">{errors.name}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="parentId"
                    className="text-xs font-bold text-slate-500 uppercase"
                  >
                    Danh mục cha
                  </label>
                  <Select
                    value={values.parentId}
                    onValueChange={(v) =>
                      updateValue("parentId", (v ?? "") as string)
                    }
                  >
                    <SelectTrigger
                      id="parentId"
                      className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30"
                    >
                      <SelectValue
                        placeholder={
                          isLoadingCategories
                            ? "Đang tải..."
                            : values.parentId
                              ? "Đã chọn"
                              : "Danh mục gốc"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesError ? (
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

                      <SelectItem value="">Danh mục gốc</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {formatOptionLabel(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="level"
                    className="text-xs font-bold text-slate-500 uppercase"
                  >
                    Cấp độ (read-only)
                  </label>
                  <Input
                    id="level"
                    value={String(computedLevel)}
                    disabled
                    className="border-slate-200 bg-slate-100 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="path"
                  className="text-xs font-bold text-slate-500 uppercase"
                >
                  Đường dẫn (path) (read-only)
                </label>
                <Input
                  id="path"
                  value={"--"}
                  disabled
                  className="border-slate-200 bg-slate-100 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Tag className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Hiển thị khi phân loại
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex h-10 items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4">
                <span className="text-sm font-bold text-emerald-800">Trạng thái</span>
                <button
                  type="button"
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition ${
                    values.isActive ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                  onClick={() => updateValue("isActive", !values.isActive)}
                  aria-label="Bật tắt hiển thị phân loại"
                >
                  <div
                    className={`absolute left-1 h-3.5 w-3.5 rounded-full bg-white shadow transition ${
                      values.isActive ? "translate-x-3.5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isSaveDisabled}
                className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-none"
              >
                <Save className="mr-2 h-4 w-4" />
                {isCreating ? "Đang lưu..." : "Lưu xác nhận"}
              </Button>

              <Button
                render={<Link href="/categories" />}
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

