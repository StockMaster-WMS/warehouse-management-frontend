"use client";

import { use } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Edit2, FolderTree, Tag } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategoryByIdQuery } from "@/store/services/category.service";

export default function CategoryDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { id } = params;
  const { data, error, isLoading, refetch } = useGetCategoryByIdQuery(id);
  const category = data?.data;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Chi tiết nhóm hàng"
        description={category ? `Thông tin đầy đủ của nhóm ${category.name}.` : "Xem thông tin danh mục."}
        actions={
          <div className="flex items-center gap-2">
            <Button render={<Link href="/categories" />} nativeButton={false} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            {category ? (
              <Button
                render={<Link href={`/categories/${category.id}/edit`} />}
                nativeButton={false}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
            ) : null}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl md:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : error || !category ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            icon={Tag}
            title="Không tìm thấy danh mục"
            description={
              (error as { data?: { message?: string } })?.data?.message ??
              "Danh mục có thể đã bị xóa hoặc không tồn tại."
            }
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Thử lại
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card title="Thông tin định danh" icon={Tag}>
              <Info label="Tên nhóm hàng" value={category.name} />
              <Info label="Mã nhóm" value={category.code} mono />
              <Info label="ID danh mục" value={category.id} mono />
            </Card>

            <Card title="Cấu trúc danh mục" icon={FolderTree}>
              <Info label="Danh mục cha" value={category.parentId || "--"} mono />
              <Info label="Đường dẫn" value={category.path || "--"} mono />
              <Info label="Cấp độ" value={category.level != null ? String(category.level) : "--"} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Trạng thái" icon={CalendarClock}>
              <Info label="Kích hoạt" value={category.isActive ? "Đang hoạt động" : "Tạm dừng"} />
              <Info
                label="Tạo lúc"
                value={category.createdAt ? new Date(category.createdAt).toLocaleString("vi-VN") : "--"}
              />
            </Card>
          </div>
        </div>
      )}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
        <Icon className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{title}</h3>
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 break-all text-sm font-semibold text-slate-800 dark:text-slate-100 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
