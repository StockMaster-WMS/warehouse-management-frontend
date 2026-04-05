"use client";

import { ReactNode, use } from "react";
import { Controller } from "react-hook-form";
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

import { useCategoryEditForm } from "@/components/features/categories";
import { CategoryTreeSelectItems } from "@/components/features/CategoryTreeSelectItems";

export default function EditCategoryPage({
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
    formState: { errors },
    submitMessage,
    onValid,
    onInvalid,
    data,
    error,
    isLoading,
    refetch,
    allCategories,
    categoriesById,
    isLoadingCategories,
    categoriesError,
    refetchCategories,
    computedLevel,
    computedPath,
    parentSelectExcludeIds,
    isSaveDisabled,
    isUpdating,
  } = useCategoryEditForm(id);

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
    <div className="w-full space-y-4 sm:space-y-6 pb-20">
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
        onSubmit={handleSubmit(onValid, onInvalid)}
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
