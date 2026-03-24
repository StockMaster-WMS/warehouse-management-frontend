"use client";

import { ReactNode, use, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Save, Tag } from "lucide-react";
import { toast } from "sonner";

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
import { CategoryTreeSelectItems } from "@/components/features/CategoryTreeSelectItems";
import { apiErrMessage } from "@/types/api";

const categoryEditSchema = z.object({
  code: z.string(),
  name: z.string().trim().min(1, "Tên nhóm hàng là bắt buộc."),
  parentId: z.string(),
  isActive: z.boolean(),
});
type CategoryEditFormData = z.infer<typeof categoryEditSchema>;

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
  const allCategories = allCategoriesData?.data?.content ?? [];

  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryEditFormData>({
    resolver: zodResolver(categoryEditSchema),
    defaultValues: { code: "", name: "", parentId: "", isActive: true },
  });

  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    if (!data?.data) return;
    const c = data.data;
    reset({
      code: c.code ?? "",
      name: c.name ?? "",
      parentId: c.parentId ?? "",
      isActive: Boolean(c.isActive),
    });
  }, [data, reset]);

  const categoriesById = useMemo(() => {
    return new Map(allCategories.map((c) => [c.id, c] as const));
  }, [allCategories]);

  const watchedCode = watch("code");
  const watchedParentId = watch("parentId");
  const watchedName = watch("name");

  const codeUpper = useMemo(() => watchedCode.trim().toUpperCase(), [watchedCode]);
  const parentCategory = watchedParentId ? categoriesById.get(watchedParentId) ?? null : null;

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

  const parentSelectExcludeIds = useMemo(() => {
    const s = new Set<string>([id]);
    for (const x of descendantIds) s.add(x);
    return s;
  }, [id, descendantIds]);

  const isSaveDisabled = useMemo(() => {
    return isUpdating || !watchedName.trim();
  }, [isUpdating, watchedName]);

  const onValid = async (formData: CategoryEditFormData) => {
    setSubmitMessage("");

    try {
      await updateCategory({
        id,
        body: {
          code: codeUpper,
          name: formData.name.trim(),
          parentId: formData.parentId ? formData.parentId : null,
          path: computedPath,
          level: computedLevel,
          isActive: formData.isActive,
        },
      }).unwrap();

      setSubmitMessage("Cập nhật nhóm hàng thành công.");
      toast.success("Đã cập nhật nhóm hàng");
    } catch (submitError) {
      const msg = apiErrMessage(submitError, "Không thể cập nhật nhóm hàng. Vui lòng thử lại.");
      setSubmitMessage(msg);
      toast.error(msg);
    }
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
          title="Không thể tải nhóm hàng"
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
        title="Chỉnh sửa nhóm / loại"
        description={`Mã ${data.data.code} · ${data.data.name}`}
        actions={
          <Button
            render={
              <Link href="/categories" aria-label="Quay lại danh sách nhóm hàng" />
            }
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
        onSubmit={handleSubmit(onValid)}
        noValidate
      >
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Tag className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin nhóm / loại
              </h3>
            </div>

            <div className="space-y-4">
              <Field label="Mã nhóm (code)" htmlFor="code" error={errors.code?.message}>
                <Input
                  id="code"
                  {...register("code")}
                  className="border-slate-200 bg-slate-50/50 font-mono text-sm uppercase focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </Field>
              <Field label="Tên hiển thị *" htmlFor="name" error={errors.name?.message}>
                <Input
                  id="name"
                  {...register("name")}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nhóm / loại cha" htmlFor="parentId">
                  <Controller
                    name="parentId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
                              return c ? `${c.name} (${c.code})` : "Đang tải tên nhóm…";
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {categoriesError ? (
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
                          <SelectItem value="">Nhóm gốc (không thuộc nhóm cha)</SelectItem>
                          <CategoryTreeSelectItems
                            categories={allCategories}
                            excludeIds={parentSelectExcludeIds}
                          />
                        </SelectContent>
                      </Select>
                    )}
                  />
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

            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  className={`flex h-10 w-full items-center justify-between rounded-xl border px-4 ${
                    field.value
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-slate-100 text-slate-600"
                  }`}
                  onClick={() => field.onChange(!field.value)}
                >
                  <span className="text-sm font-bold">
                    {field.value ? "Đang hoạt động" : "Tạm dừng"}
                  </span>
                  <div
                    className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                      field.value ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  >
                    <div
                      className={`absolute left-1 h-3.5 w-3.5 rounded-full bg-white shadow transition ${
                        field.value ? "translate-x-3.5" : ""
                      }`}
                    />
                  </div>
                </button>
              )}
            />
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
