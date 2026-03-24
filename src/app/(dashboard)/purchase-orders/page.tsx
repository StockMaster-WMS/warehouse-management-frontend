"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, FileText, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetPurchaseOrdersQuery } from "@/store/services/purchase-order.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { PurchaseOrder } from "@/types/purchase-order";

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetPurchaseOrdersQuery({
    page,
    size: 20,
  });

  const rows = data?.data?.content ?? [];
  const pagedBody = data?.data;

  const paged = useMemo((): Pick<
    PagedResponse<PurchaseOrder>,
    "page" | "size" | "total_elements" | "total_pages"
  > | null => {
    if (!pagedBody || typeof pagedBody.page !== "number" || typeof pagedBody.total_pages !== "number") return null;
    return {
      page: pagedBody.page,
      size: pagedBody.size,
      total_elements: pagedBody.total_elements,
      total_pages: pagedBody.total_pages,
    };
  }, [pagedBody]);

  const canGoPrev = page > 0;
  const canGoNext = paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn nhập hàng"
        description="Purchase Order — quản lý đơn đặt hàng từ nhà cung cấp."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              render={<Link href="/putaway" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="border-slate-200"
            >
              Putaway
            </Button>
            <Button
              render={<Link href="/purchase-orders/new" />}
              nativeButton={false}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn nhập
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Mã PO</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Dự kiến</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`po-skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-16 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách đơn nhập"
                      description={apiErrMessage(error, "Lỗi mạng hoặc máy chủ từ chối yêu cầu.")}
                      action={
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="Chưa có đơn nhập"
                      description="Chưa có đơn nhập hoặc API trả về rỗng."
                      action={
                        <Button
                          render={<Link href="/purchase-orders/new" />}
                          nativeButton={false}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          Tạo đơn đầu tiên
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((po: PurchaseOrder) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.orderDate}</TableCell>
                    <TableCell>{po.expectedDate ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {po.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        render={<Link href={`/purchase-orders/${po.id}`} />}
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600"
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {isLoading ? (
                <span>Đang tải danh sách…</span>
              ) : isError ? (
                <span className="text-rose-600 dark:text-rose-400">Không tải được dữ liệu.</span>
              ) : paged ? (
                <span>
                  Hiển thị {rows.length}/{paged.total_elements} đơn nhập
                  {paged.total_pages > 1
                    ? ` · Trang ${paged.page + 1}/${paged.total_pages}`
                    : ""}
                </span>
              ) : (
                <span>{rows.length} bản ghi</span>
              )}
            </div>
            {paged && paged.total_pages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoPrev || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoNext || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
