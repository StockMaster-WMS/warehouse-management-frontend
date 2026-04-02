"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Loader2,
  PackagePlus,
  Search,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { PurchaseOrder } from "@/types/purchase-order";
import {
  useGetLocationsQuery,
  useGetPurchaseOrderDetailQuery,
  useGetPurchaseOrdersQuery,
} from "@/store/services/purchase-order.service";
import { useCreateInboundReceiptMutation } from "@/store/services/inbound.service";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/* ===== Step 1: Select PO ===== */
function SelectPoStep({ onSelect }: { onSelect: (id: string) => void }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const debouncedKeyword = useDebouncedValue(keyword, 350);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetPurchaseOrdersQuery({
      page,
      size: 20,
      status: statusFilter === "ALL" ? "APPROVED" : statusFilter,
      ...(debouncedKeyword.trim() ? { keyword: debouncedKeyword.trim() } : {}),
      sort: "createdAt",
      sortDir: "desc",
    });

  const rows = data?.data?.content ?? [];
  const pagedBody = data?.data;
  const totalPages = pagedBody?.total_pages ?? 0;
  const totalElements = pagedBody?.total_elements ?? 0;

  const hasAnyFilter = Boolean(
    keyword.trim() || (statusFilter !== "ALL" && statusFilter),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Tạo phiếu nhập"
        description="Chọn PO ở trạng thái DRAFT và Confirm PO để bắt đầu nhận hàng."
        actions={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
            onClick={() => router.push("/inbound")}
          >
            <FileText className="h-4 w-4" />
          </Button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Filter className="h-4 w-4 text-indigo-500" />
          Tìm đơn nhập hàng
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
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
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v ?? "ALL");
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Đã duyệt & Nhận 1 phần</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="PARTIAL">Nhận một phần</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasAnyFilter ? (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setKeyword("");
                setStatusFilter("ALL");
                setPage(0);
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : null}
      </div>

      {/* Table card */}
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
                  <TableRow key={`po-draft-skel-${i}`}>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách PO"
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
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="Không có PO sẵn sàng"
                      description="Không có đơn nhập hàng nào ở trạng thái Đã duyệt hoặc Nhận một phần."
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
                    <TableCell className="px-3 py-3">{po.status ?? "DRAFT"}</TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => onSelect(po.id)}
                      >
                        <PackagePlus className="mr-1 h-4 w-4" />
                        Chọn
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination footer */}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              {isLoading ? (
                <span>Đang tải danh sách…</span>
              ) : isError ? (
                <span className="text-rose-600 dark:text-rose-400">
                  Không tải được dữ liệu.
                </span>
              ) : (
                <span>
                  Hiển thị {rows.length}/{totalElements} đơn
                  {totalPages > 1 ? ` · Trang ${page + 1}/${totalPages}` : ""}
                </span>
              )}
            </div>
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1 || isFetching}
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

/* ===== Step 2: Input GRN Lines ===== */
function GrnForm({ poId, onBack }: { poId: string; onBack: () => void }) {
  const router = useRouter();

  const { data: detailRes, isLoading: detailLoading } =
    useGetPurchaseOrderDetailQuery(poId);
  const detail = detailRes?.data;
  const po = detail?.purchaseOrder;
  const items = detail?.items ?? [];

  const { data: whLocRes } = useGetLocationsQuery(
    { warehouseId: po?.warehouseId ?? "" },
    { skip: !po?.warehouseId },
  );
  const locationOptions = Array.isArray(whLocRes?.data) ? whLocRes.data : [];

  const [locationId, setLocationId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<
    Record<string, { qty: string; note: string }>
  >({});

  // Initialise lines when items load
  const linesInit = useMemo(() => {
    const init: Record<string, { qty: string; note: string }> = {};
    for (const item of items) {
      const remain =
        Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (remain > 0) {
        init[item.id] = { qty: "", note: "" };
      }
    }
    return init;
  }, [items]);

  // Merge once
  const mergedLines = useMemo(() => {
    const m = { ...linesInit };
    for (const [k, v] of Object.entries(lines)) {
      if (m[k]) m[k] = v;
    }
    return m;
  }, [linesInit, lines]);

  function setLine(id: string, field: "qty" | "note", val: string) {
    setLines((prev) => ({
      ...prev,
      [id]: { ...mergedLines[id], [field]: val },
    }));
  }

  const [createGrn, { isLoading: creating }] =
    useCreateInboundReceiptMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines = Object.entries(mergedLines)
      .map(([poItemId, v]) => {
        const qty = Number(v.qty.replace(",", "."));
        if (!qty || Number.isNaN(qty) || qty <= 0) return null;
        return {
          poItemId,
          receivedQty: qty,
          ...(v.note.trim() ? { note: v.note.trim() } : {}),
        };
      })
      .filter(Boolean) as {
      poItemId: string;
      receivedQty: number;
      note?: string;
    }[];

    if (validLines.length === 0) {
      toast.error("Nhập số lượng ít nhất 1 dòng hàng");
      return;
    }

    // Validate max
    for (const line of validLines) {
      const item = items.find((i) => i.id === line.poItemId);
      if (!item) continue;
      const remain =
        Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (line.receivedQty > remain) {
        toast.error(
          `Dòng ${item.productSku}: số lượng nhập (${line.receivedQty}) vượt quá còn lại (${remain})`,
        );
        return;
      }
    }

    if (!locationId.trim()) {
      toast.error("Vui lòng chọn vị trí nhận hàng");
      return;
    }

    try {
      const res = await createGrn({
        purchaseOrderId: poId,
        locationId: locationId.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
        items: validLines,
      }).unwrap();

      if (!res.success) {
        toast.error(res.message || "Tạo phiếu nhập kho thất bại");
        return;
      }
      toast.success(
        `Đã tạo phiếu nhập kho: ${res.data?.receiptNumber ?? "OK"}`,
      );
      router.push(`/purchase-orders/${poId}`);
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  if (detailLoading)
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="h-5 w-5 animate-spin" />
        Đang tải chi tiết PO...
      </div>
    );

  if (!po)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <EmptyState
          icon={AlertCircle}
          title="Không tải được chi tiết PO"
          description="Đơn nhập hàng không tồn tại hoặc đã bị xoá."
          action={
            <Button variant="outline" size="sm" onClick={onBack}>
              Quay lại
            </Button>
          }
          className="py-10"
        />
      </div>
    );

  const receivableItems = items.filter(
    (i) => Number(i.orderedQty ?? 0) - Number(i.receivedQty ?? 0) > 0,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* PO Summary */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {po.poNumber}
          </p>
          <p className="text-xs text-slate-500">
            {po.status === "APPROVED" ? "Đã duyệt" : "Nhận một phần"} — Ngày
            đặt: {po.orderDate}
          </p>
        </div>
      </div>

      {receivableItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            icon={FileText}
            title="Đã nhập đủ hàng"
            description="Tất cả dòng hàng đã nhập đủ. Không thể tạo phiếu nhập mới."
            action={
              <Button variant="outline" size="sm" onClick={onBack}>
                Quay lại
              </Button>
            }
            className="py-10"
          />
        </div>
      ) : (
        <>
          {/* Lines Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">SL đặt</TableHead>
                    <TableHead className="text-right">Đã nhận</TableHead>
                    <TableHead className="text-right">Còn lại</TableHead>
                    <TableHead className="text-right">Nhập lần này</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivableItems.map((item) => {
                    const ordered = Number(item.orderedQty ?? 0);
                    const received = Number(item.receivedQty ?? 0);
                    const remain = Math.max(0, ordered - received);
                    const lineVal = mergedLines[item.id] ?? {
                      qty: "",
                      note: "",
                    };
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.productSku}
                        </TableCell>
                        <TableCell className="text-right">{ordered}</TableCell>
                        <TableCell className="text-right">{received}</TableCell>
                        <TableCell className="text-right font-medium">
                          {remain}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            value={lineVal.qty}
                            onChange={(e) =>
                              setLine(item.id, "qty", e.target.value)
                            }
                            inputMode="decimal"
                            placeholder={`Tối đa ${remain}`}
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={lineVal.note}
                            onChange={(e) =>
                              setLine(item.id, "note", e.target.value)
                            }
                            placeholder="Ghi chú"
                            className="w-36"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Location + Note */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Vị trí nhận hàng <span className="text-rose-500">*</span>
              </label>
              {locationOptions.length === 0 ? (
                <p className="mt-1 text-xs text-amber-600">
                  Kho này chưa có vị trí nào. Vui lòng tạo vị trí cho kho trước
                  khi nhập hàng.
                </p>
              ) : (
                <Select
                  value={locationId || "__empty__"}
                  onValueChange={(v) =>
                    setLocationId(!v || v === "__empty__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code ?? loc.name ?? loc.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Ghi chú phiếu nhập (tuỳ chọn)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú chung"
                rows={2}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onBack}>
              Quay lại
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo phiếu nhập kho
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

/* ===== Main Page ===== */
export default function NewInboundReceiptPage() {
  const searchParams = useSearchParams();
  const initialPoId = searchParams.get("poId") ?? "";
  const [selectedPoId, setSelectedPoId] = useState(initialPoId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tạo phiếu nhập kho"
        description={
          selectedPoId
            ? "Nhập số lượng thực nhận cho từng dòng hàng"
            : "Chọn PO đã duyệt hoặc nhận một phần để bắt đầu nhập hàng"
        }
        actions={
          <Button
            render={<Link href="/inbound" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      {selectedPoId ? (
        <GrnForm poId={selectedPoId} onBack={() => setSelectedPoId("")} />
      ) : (
        <SelectPoStep onSelect={(id) => setSelectedPoId(id)} />
      )}
    </div>
  );
}
