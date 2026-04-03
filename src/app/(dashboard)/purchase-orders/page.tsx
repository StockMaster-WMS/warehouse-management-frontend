"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";

const STATUS_OPTIONS = [
  "DRAFT",
  "APPROVED",
  "PARTIAL",
  "COMPLETED",
  "CANCELLED",
] as const;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  APPROVED: "Đã duyệt",
  PARTIAL: "Nhận một phần",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function statusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "APPROVED":
      return "bg-blue-100 text-blue-700";
    case "PARTIAL":
      return "bg-amber-100 text-amber-700";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  const { data: suppliersRes } = useGetSuppliersQuery({
    page: 0,
    size: 100,
    sort: "createdAt",
    sortDir: "desc",
  });
  const { data: warehousesRes } = useGetWarehousesQuery({
    page: 0,
    size: 100,
    sort: "createdAt",
    sortDir: "desc",
  });

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetPurchaseOrdersQuery({
      page,
      size: 20,
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
      ...(status ? { status } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
    });

  const rows = data?.data?.content ?? [];
  const pagedBody = data?.data;
  const suppliers = suppliersRes?.data?.content ?? [];
  const warehouses = warehousesRes?.data?.content ?? [];

  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of suppliers) map.set(s.id, s.name ?? s.code ?? s.id);
    return map;
  }, [suppliers]);
  const warehouseMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of warehouses) map.set(w.id, w.name);
    return map;
  }, [warehouses]);

  const paged = useMemo((): Pick<
    PagedResponse<PurchaseOrder>,
    "page" | "size" | "total_elements" | "total_pages"
  > | null => {
    if (
      !pagedBody ||
      typeof pagedBody.page !== "number" ||
      typeof pagedBody.total_pages !== "number"
    )
      return null;
    return {
      page: pagedBody.page,
      size: pagedBody.size,
      total_elements: pagedBody.total_elements,
      total_pages: pagedBody.total_pages,
    };
  }, [pagedBody]);

  const canGoPrev = page > 0;
  const canGoNext =
    paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;
  const hasAnyFilter = Boolean(
    keyword.trim() || status || supplierId || warehouseId,
  );

  const clearFilters = () => {
    setKeyword("");
    setStatus("");
    setSupplierId("");
    setWarehouseId("");
    setPage(0);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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

      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Filter className="h-4 w-4 text-indigo-500" />
          Bộ lọc PO
        </div>
        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              placeholder="Tìm theo mã PO..."
              className="pl-9"
            />
          </div>
          <Select
            value={status || "__all__"}
            onValueChange={(v) => {
              const next = String(v ?? "");
              setStatus(next === "__all__" ? "" : next);
              setPage(0);
            }}
          >
            <SelectTrigger id="po-status-select-trigger">
              <span className="flex flex-1 truncate text-left">
                {status ? (STATUS_LABEL[status] ?? status) : "Tất cả trạng thái"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
              {STATUS_OPTIONS.map((st) => (
                <SelectItem key={st} value={st}>
                  {STATUS_LABEL[st] ?? st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={supplierId || "__all__"}
            onValueChange={(v) => {
              const next = String(v ?? "");
              setSupplierId(next === "__all__" ? "" : next);
              setPage(0);
            }}
          >
            <SelectTrigger id="po-supplier-select-trigger">
              <span className="flex flex-1 truncate text-left">
                {supplierId ? (supplierMap.get(supplierId) ?? supplierId) : "Tất cả nhà cung cấp"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả nhà cung cấp</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name ?? s.code ?? s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={warehouseId || "__all__"}
            onValueChange={(v) => {
              const next = String(v ?? "");
              setWarehouseId(next === "__all__" ? "" : next);
              setPage(0);
            }}
          >
            <SelectTrigger id="po-warehouse-select-trigger">
              <span className="flex flex-1 truncate text-left">
                {warehouseId ? (warehouseMap.get(warehouseId) ?? warehouseId) : "Tất cả kho"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả kho</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasAnyFilter ? (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table className="min-w-215 text-left">
            <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <TableRow>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã PO</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày đặt</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Dự kiến</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`po-skel-${i}`}>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <Skeleton className="ml-auto h-8 w-16 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách đơn nhập"
                      description={apiErrMessage(
                        error,
                        "Lỗi mạng hoặc máy chủ từ chối yêu cầu.",
                      )}
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                        >
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
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
                  <TableRow key={po.id} className="group transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70">
                    <TableCell className="px-3 py-3 font-medium">{po.poNumber}</TableCell>
                    <TableCell className="px-3 py-3">{po.orderDate}</TableCell>
                    <TableCell className="px-3 py-3">{po.expectedDate ?? "—"}</TableCell>
                    <TableCell className="px-3 py-3">
                      <Badge
                        variant="secondary"
                        className={`font-normal ${statusBadgeClass(po.status)}`}
                      >
                        {STATUS_LABEL[po.status ?? ""] ?? po.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
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
                <span className="text-rose-600 dark:text-rose-400">
                  Không tải được dữ liệu.
                </span>
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
