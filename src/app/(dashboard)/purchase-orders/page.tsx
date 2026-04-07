"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { cn } from "@/lib/utils";
import {
  Plus,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationFooter } from "@/components/ui/pagination-footer";
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
import type { Supplier } from "@/types/supplier";
import type { Warehouse } from "@/types/warehouse";

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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const {
    data: suppliersRes,
    isLoading: suppliersLoading,
    isError: suppliersIsError,
    refetch: refetchSuppliers,
  } = useGetSuppliersQuery({
    page: 0,
    size: 100,
    sort: "createdAt",
    sortDir: "desc",
  });
  const {
    data: warehousesRes,
    isLoading: warehousesLoading,
    isError: warehousesIsError,
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery({
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
  const suppliers = useMemo(() => suppliersRes?.data?.content ?? [], [suppliersRes]);
  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);

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
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (status) count++;
    if (supplierId) count++;
    if (warehouseId) count++;
    return count;
  }, [status, supplierId, warehouseId]);

  const hasAnyFilter = Boolean(keyword.trim() || activeFiltersCount > 0);

  const clearFilters = () => {
    setKeyword("");
    setStatus("");
    setSupplierId("");
    setWarehouseId("");
    setPage(0);
  };

  const findSupplier = (id: string) => suppliers.find((s: Supplier) => s.id === id);
  const findWarehouse = (id: string) => warehouses.find((w: Warehouse) => w.id === id);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Đơn nhập hàng"
        description="Purchase Order — quản lý đơn đặt hàng từ nhà cung cấp."
        actions={
          <div className="flex items-center gap-2">
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
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn nhập
            </Button>
          </div>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
        {/* Unified Search Section */}
        <SearchToolbar
          noContainer
          placeholder="Tìm kiếm theo mã PO..."
          value={keyword}
          onValueChange={(v) => {
            setKeyword(v || "");
            setPage(0);
          }}
          right={
            <AdvancedFilterActions
              open={advancedOpen}
              onToggle={() => setAdvancedOpen(!advancedOpen)}
              activeCount={activeFiltersCount}
              hasAnyFilter={hasAnyFilter}
              onClear={clearFilters}
            />
          }
          filters={
            advancedOpen || activeFiltersCount > 0 ? (
              <AdvancedFilterPanel
                open={advancedOpen}
                summary={
                  activeFiltersCount > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {status ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                          Trạng thái:{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {STATUS_LABEL[status] ?? status}
                          </span>
                        </span>
                      ) : null}
                      {supplierId ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                          NCC:{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {findSupplier(supplierId)?.name ?? "—"}
                          </span>
                        </span>
                      ) : null}
                      {warehouseId ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                          Kho:{" "}
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {findWarehouse(warehouseId)?.name ?? "—"}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  ) : null
                }
              >
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v || "");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white sm:w-42 dark:border-slate-800 dark:bg-slate-900">
                    <SelectValue placeholder="Tất cả trạng thái">
                      {(val) => STATUS_LABEL[val as string] ?? "Tất cả trạng thái"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="" className="rounded-lg">
                      Tất cả trạng thái
                    </SelectItem>
                    {STATUS_OPTIONS.map((st) => (
                      <SelectItem key={st} value={st} className="rounded-lg">
                        {STATUS_LABEL[st] ?? st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={supplierId}
                  onValueChange={(v) => {
                    setSupplierId(v || "");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-60 sm:w-55 dark:border-slate-800 dark:bg-slate-900">
                    <SelectValue
                      placeholder={
                        suppliersLoading
                          ? "Đang tải NCC..."
                          : suppliersIsError
                            ? "Lỗi tải NCC"
                            : "Tất cả nhà cung cấp"
                      }
                    >
                      {(val) => {
                        if (!val) return "Tất cả nhà cung cấp";
                        const s = findSupplier(val as string);
                        return s ? `${s.name} (${s.code || "—"})` : "—";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-xl">
                    {suppliersIsError ? (
                      <div className="px-2 py-1.5 text-xs text-rose-500">
                        Không tải được NCC.
                        <button
                          type="button"
                          onClick={() => refetchSuppliers()}
                          className="ml-1 underline"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : null}
                    <SelectItem value="" className="rounded-lg">
                      Tất cả nhà cung cấp
                    </SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg">
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={warehouseId}
                  onValueChange={(v) => {
                    setWarehouseId(v || "");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white sm:max-w-60 sm:w-55 dark:border-slate-800 dark:bg-slate-900">
                    <SelectValue
                      placeholder={
                        warehousesLoading
                          ? "Đang tải kho..."
                          : warehousesIsError
                            ? "Lỗi tải kho"
                            : "Tất cả kho"
                      }
                    >
                      {(val) => {
                        if (!val) return "Tất cả kho";
                        const w = findWarehouse(val as string);
                        return w ? `${w.name} (${w.code || "—"})` : "—";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-xl">
                    {warehousesIsError ? (
                      <div className="px-2 py-1.5 text-xs text-rose-500">
                        Không tải được kho.
                        <button
                          type="button"
                          onClick={() => refetchWarehouses()}
                          className="ml-1 underline"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : null}
                    <SelectItem value="" className="rounded-lg">
                      Tất cả kho
                    </SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="rounded-lg">
                        {w.name} {w.code ? `(${w.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AdvancedFilterPanel>
            ) : null
          }
        />

        {/* Updated Table UI */}
        <div className="flex-1">
          {isFetching && !isLoading ? (
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              Đang cập nhật dữ liệu…
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table className="min-w-px text-left border-collapse">
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="w-[180px] py-4 pl-6 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã PO</TableHead>
                  <TableHead className="w-[200px] px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày đặt</TableHead>
                  <TableHead className="w-[200px] px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Dự kiến</TableHead>
                  <TableHead className="w-[180px] px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                  <TableHead className="w-[150px] py-4 pl-3 pr-6 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`po-skel-${i}`} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="py-4 pl-6 pr-3"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                      <TableCell className="px-3 py-4"><Skeleton className="h-4 w-32 rounded" /></TableCell>
                      <TableCell className="px-3 py-4"><Skeleton className="h-4 w-32 rounded" /></TableCell>
                      <TableCell className="px-3 py-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="py-4 pl-3 pr-6 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12">
                      <EmptyState
                        icon={AlertCircle}
                        title="Không tải được danh sách đơn nhập"
                        description={apiErrMessage(error, "Lỗi mạng hoặc máy chủ từ chối yêu cầu.")}
                        action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                      />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12">
                      <EmptyState
                        icon={FileText}
                        title="Chưa có đơn nhập"
                        description="Chưa có đơn nhập nào trong hệ thống hoặc cụm từ tìm kiếm không trùng khớp."
                        action={
                          <Button render={<Link href="/purchase-orders/new" />} nativeButton={false} size="sm" className="bg-indigo-600">
                            Tạo đơn đầu tiên
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((po: PurchaseOrder) => (
                    <TableRow
                      key={po.id}
                      className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <TableCell className="py-4 pl-6 pr-3 font-semibold text-slate-700 dark:text-slate-200">{po.poNumber}</TableCell>
                      <TableCell className="px-3 py-4 text-slate-600 dark:text-slate-400">{po.orderDate}</TableCell>
                      <TableCell className="px-3 py-4 text-slate-600 dark:text-slate-400">{po.expectedDate ?? "—"}</TableCell>
                      <TableCell className="px-3 py-4">
                        <Badge
                          variant="secondary"
                          className={cn("px-2.5 py-0.5 font-bold text-[11px] rounded-md border-0 shadow-none", statusBadgeClass(po.status))}
                        >
                          {STATUS_LABEL[po.status ?? ""] ?? po.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 pl-3 pr-6 text-right">
                        <Button
                          render={<Link href={`/purchase-orders/${po.id}`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/30 dark:text-indigo-400"
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
        </div>

        <PaginationFooter
          itemLabel="đơn nhập"
          rowsCount={rows.length}
          page={page}
          totalElements={paged?.total_elements ?? rows.length}
          totalPages={paged?.total_pages ?? 1}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          errorText="Không tải được dữ liệu."
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          pageSize={paged?.size ?? 20}
        />
      </div>
    </div>
  );
}
