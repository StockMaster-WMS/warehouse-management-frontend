"use client";

import { FormEvent, ReactNode, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Tag } from "lucide-react";

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
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
} from "@/store/services/category.service";

type CategoryFormValues = {
  code: string;
  name: string;
  parentId: string; // "" => root
  isActive: boolean;
};

type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, string>>;

export default function EditCategoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { id } = params;

  const { data, error, isLoading, refetch } = useGetCategoryByIdQuery(id);
  const {
    data: allCategoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const allCategories = allCategoriesData?.data ?? [];

  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const [values, setValues] = useState<CategoryFormValues>({
    code: "",
    name: "",
    parentId: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    if (!data?.data) return;
    const c = data.data;
    setValues({
      code: c.code ?? "",
      name: c.name ?? "",
      parentId: c.parentId ?? "",
      isActive: Boolean(c.isActive),
    });
  }, [data]);

  const categoriesById = useMemo(() => {
    return new Map(allCategories.map((c) => [c.id, c] as const));
  }, [allCategories]);

  const codeUpper = useMemo(() => values.code.trim().toUpperCase(), [values.code]);
  const parentCategory = values.parentId ? categoriesById.get(values.parentId) ?? null : null;

  const computedLevel = useMemo(() => {
    if (!parentCategory) return 0;
    return (parentCategory.level ?? 0) + 1;
  }, [parentCategory]);

  const computedPath = useMemo(() => {
    if (!codeUpper) return "";
    if (!parentCategory) return codeUpper;
    const parentPath = parentCategory.path ?? "";
    return parentPath ? `${parentPath}/${codeUpper}` : codeUpper;
  }, [codeUpper, parentCategory]);

  // Prevent selecting the category itself or its descendants as parent.
  const descendantIds = useMemo(() => {
    if (!id) return new Set<string>();
    const childrenByParentId = new Map<string, typeof allCategories>();
    allCategories.forEach((cat) => {
      const p = cat.parentId ?? "";
      const prev = childrenByParentId.get(p) ?? [];
      prev.push(cat);
      childrenByParentId.set(p, prev);
    });

    const out = new Set<string>();
    const stack: string[] = [id];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (!cur) continue;
      const children = childrenByParentId.get(cur) ?? [];
      for (const ch of children) {
        if (ch.id === id) continue;
        if (out.has(ch.id)) continue;
        out.add(ch.id);
        stack.push(ch.id);
      }
    }
    out.delete(id);
    return out;
  }, [allCategories, id]);

  const isSaveDisabled = useMemo(() => {
    return isUpdating || !values.name.trim();
  }, [isUpdating, values.name]);

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
      await updateCategory({
        id,
        body: {
          code: codeUpper,
          name: values.name.trim(),
          parentId: values.parentId ? values.parentId : null,
          path: computedPath,
          level: computedLevel,
          isActive: values.isActive,
        },
      }).unwrap();

      setSubmitMessage("Cập nhật nhóm hàng thành công.");
    } catch (submitError) {
      setSubmitMessage(
        (submitError as { data?: { message?: string } })?.data?.message ??
          "Không thể cập nhật nhóm hàng. Vui lòng thử lại.",
      );
    }
  };

  const formatOptionLabel = (cat: (typeof allCategories)[number]) => {
    const depth = typeof cat.level === "number" ? cat.level : 0;
    const safeDepth = Math.max(0, Math.min(depth, 8));
    const prefix = safeDepth > 0 ? `${"-".repeat(safeDepth)} ` : "";
    return `${prefix}${cat.name} (${cat.code})`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-96 rounded-2xl md:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        <EmptyState
          icon={Tag}
          title="Không thể tải danh mục"
          description={
            (error as { data?: { message?: string } })?.data?.message ??
            "Dữ liệu không tồn tại hoặc đã bị xóa."
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
        title="Chỉnh sửa nhóm hàng"
        description={`Cập nhật cấu hình danh mục ${data.data.name}.`}
        actions={
          <Button
            render={<Link href={`/categories/${id}`} />}
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
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Tag className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin cơ bản
              </h3>
            </div>

            <div className="space-y-4">
              <Field label="Mã nhóm hàng (tự sinh nếu bỏ trống)" htmlFor="code" error={errors.code}>
                <Input
                  id="code"
                  value={values.code}
                  onChange={(e) => updateValue("code", e.target.value)}
                />
              </Field>
              <Field label="Tên nhóm hàng *" htmlFor="name" error={errors.name}>
                <Input
                  id="name"
                  value={values.name}
                  onChange={(e) => updateValue("name", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nhóm / loại cha" htmlFor="parentId">
                  <Select
                    value={values.parentId}
                    onValueChange={(v) => updateValue("parentId", v ?? "")}
                  >
                    <SelectTrigger
                      id="parentId"
                      className="h-auto min-h-10 w-full min-w-0 border-slate-200 bg-slate-50/50 py-2 focus:ring-indigo-500/30"
                    >
                      <SelectValue
                        placeholder={
                          isLoadingCategories
                            ? "Đang tải danh sách nhóm..."
                            : "Chọn nhóm cha hoặc để gốc"
                        }
                      >
                        {(val) => {
                          if (val === "" || val == null) {
                            return "Nhóm gốc (không thuộc nhóm cha)";
                          }
                          const c = categoriesById.get(val as string);
                          return c ? formatOptionLabel(c) : "Đang tải tên nhóm…";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
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
                      <SelectItem value="">Nhóm gốc (không thuộc nhóm cha)</SelectItem>
                      {allCategories
                        .filter((c) => c.id !== id && !descendantIds.has(c.id))
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {formatOptionLabel(cat)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Cấp độ (read-only)" htmlFor="level">
                  <Input
                    id="level"
                    value={String(computedLevel)}
                    disabled
                    className="border-slate-200 bg-slate-100 font-mono text-sm"
                  />
                </Field>
              </div>

              <Field label="Đường dẫn (path) (read-only)" htmlFor="path">
                <Input
                  id="path"
                  value={computedPath}
                  disabled
                  className="border-slate-200 bg-slate-100 font-mono text-sm"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Tag className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Trạng thái
              </h3>
            </div>

            <button
              type="button"
              className={`flex h-10 w-full items-center justify-between rounded-xl border px-4 ${
                values.isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-300 bg-slate-100 text-slate-600"
              }`}
              onClick={() => updateValue("isActive", !values.isActive)}
            >
              <span className="text-sm font-bold">
                {values.isActive ? "Đang hoạt động" : "Tạm dừng"}
              </span>
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                  values.isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              >
                <div
                  className={`absolute left-1 h-3.5 w-3.5 rounded-full bg-white shadow transition ${
                    values.isActive ? "translate-x-3.5" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isSaveDisabled}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
              >
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "Đang lưu..." : "Lưu cập nhật"}
              </Button>
              <Button
                render={<Link href={`/categories/${id}`} />}
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

