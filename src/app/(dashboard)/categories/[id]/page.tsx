"use client";

import { use, useMemo } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Edit2,
  FolderTree,
  Layers,
  ListOrdered,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
} from "@/store/services/category.service";
import type { Category } from "@/store/services/category.service";

export default function CategoryDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { id } = params;
  const { data, error, isLoading, refetch } = useGetCategoryByIdQuery(id);
  const { data: allCategoriesData } = useGetCategoriesQuery();
  const category = data?.data;
  const allCategories = allCategoriesData?.data ?? [];

  const categoriesById = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c] as const)),
    [allCategories],
  );

  const parentLabel = useMemo(() => {
    if (!category?.parentId) return "Nhóm gốc (không thuộc nhóm cha)";
    const p = categoriesById.get(category.parentId);
    return p ? `${p.name} (${p.code})` : category.parentId;
  }, [category, categoriesById]);

  const parentResolved = useMemo(() => {
    if (!category) return true;
    if (!category.parentId) return true;
    return categoriesById.has(category.parentId);
  }, [category, categoriesById]);

  return (
    <div className="space-y-6 pb-20">
      {isLoading ? (
        <>
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Skeleton className="h-64 rounded-2xl md:col-span-2" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </>
      ) : error || !category ? (
        <>
          <PageHeader
            title="Chi tiết nhóm / loại"
            description="Không tải được dữ liệu hoặc mục không tồn tại."
            actions={
              <Button
                render={<Link href="/categories" />}
                nativeButton={false}
                variant="outline"
                size="sm"
                className="border-slate-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Về danh sách
              </Button>
            }
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            <EmptyState
              icon={Tag}
              title="Không tìm thấy nhóm hàng"
              description={
                (error as { data?: { message?: string } })?.data?.message ??
                "Nhóm có thể đã bị xóa hoặc không tồn tại."
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Thử lại
                  </Button>
                  <Button
                    render={<Link href="/categories" />}
                    nativeButton={false}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <ListOrdered className="mr-2 h-4 w-4" />
                    Cây phân loại
                  </Button>
                </div>
              }
            />
          </div>
        </>
      ) : (
        <>
          <CategoryHero
            category={category}
            parentLabel={parentLabel}
            parentResolved={parentResolved}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card title="Thông tin nhóm / loại" icon={Tag}>
                <Info label="Tên hiển thị" value={category.name} />
                <Info label="Mã nhóm" value={category.code} mono />
                <Info
                  label="Nhóm / loại cha"
                  value={parentLabel}
                  mono={Boolean(category.parentId) && !parentResolved}
                />
              </Card>

              <Card title="Cấu trúc & đường dẫn" icon={FolderTree}>
                <Info label="Đường dẫn (path)" value={category.path || "—"} mono />
                <Info
                  label="Cấp độ"
                  value={category.level != null ? String(category.level) : "—"}
                />
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Trạng thái & lịch sử" icon={CalendarClock}>
                <Info
                  label="Kích hoạt"
                  value={category.isActive ? "Đang hoạt động" : "Tạm dừng"}
                />
                <Info
                  label="Tạo lúc"
                  value={
                    category.createdAt
                      ? new Date(category.createdAt).toLocaleString("vi-VN")
                      : "—"
                  }
                />
              </Card>

              <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                    Thao tác
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    render={<Link href={`/categories/${category.id}/edit`} />}
                    nativeButton={false}
                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    render={<Link href="/categories" />}
                    nativeButton={false}
                    variant="outline"
                    className="w-full justify-center border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  >
                    <ListOrdered className="mr-2 h-4 w-4" />
                    Cây phân loại
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryHero({
  category,
  parentLabel,
  parentResolved,
}: {
  category: Category;
  parentLabel: string;
  parentResolved: boolean;
}) {
  const initials = (category.name || category.code || "?").trim().slice(0, 2).toUpperCase();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/30 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25 sm:h-16 sm:w-16 sm:text-base"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Link
                href="/categories"
                className="text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Nhóm / loại hàng
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              <span className="truncate text-slate-600 dark:text-slate-300">Chi tiết</span>
            </nav>
            <h1 className="mt-1.5 break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {category.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                {category.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  category.isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {category.isActive ? "Hoạt động" : "Tạm dừng"}
              </span>
              {category.parentId ? (
                <span
                  className={`max-w-full truncate rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 ${!parentResolved ? "font-mono" : ""}`}
                >
                  Con của: {parentLabel}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Nhóm gốc
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button
            render={<Link href={`/categories/${category.id}/edit`} />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm sm:min-w-[132px]"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button
            render={<Link href="/categories" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900 sm:min-w-[132px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Danh sách
          </Button>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
      <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
        <Icon className="h-4 w-4 shrink-0 text-indigo-600" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-900/55">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100 ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
