"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  FileText,
  Loader2,
  PackagePlus,
  Search,
  CheckCircle2,
  Building2,
  ClipboardList,
  SlidersHorizontal,
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
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { apiErrMessage } from "@/types/api";
import type { PurchaseOrder } from "@/types/purchase-order";
import {
  useGetLocationsQuery,
  useGetPurchaseOrderDetailQuery,
  useGetPurchaseOrdersQuery,
} from "@/store/services/purchase-order.service";
import { useCreateInboundReceiptMutation } from "@/store/services/inbound.service";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

/* ── Step Indicator ─────────────────────────────────────────────────── */
function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { label: "Chọn PO", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Nhập số lượng", icon: <PackagePlus className="h-4 w-4" /> },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={num} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              done && "text-emerald-600 dark:text-emerald-400",
              active && "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none",
              !done && !active && "text-slate-400 dark:text-slate-600",
            )}>
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                done && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
                active && "bg-white/20 text-white",
                !done && !active && "bg-slate-100 text-slate-400 dark:bg-slate-800",
              )}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : num}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "mx-1 h-px w-8 transition-colors",
                done ? "bg-emerald-300 dark:bg-emerald-700" : "bg-slate-200 dark:bg-slate-700"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 1: Select PO ────────────────────────────────────────────── */
function SelectPoStep({ onSelect }: { onSelect: (id: string) => void }) {
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

  const hasAnyFilter = Boolean(keyword.trim() || (statusFilter !== "ALL" && statusFilter));

  const PO_STATUS: Record<string, string> = {
    APPROVED: "Đã duyệt",
    PARTIAL: "Nhận một phần",
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-44">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            placeholder="Tìm theo mã PO..."
            className="pl-9 h-9 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v ?? "ALL"); setPage(0); }}
        >
          <SelectTrigger className="h-9 w-44 shrink-0 whitespace-nowrap rounded-xl border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 truncate text-sm">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {statusFilter === "ALL" ? "Tất cả trạng thái" : PO_STATUS[statusFilter] ?? statusFilter}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="ALL" className="rounded-lg">Tất cả</SelectItem>
            <SelectItem value="APPROVED" className="rounded-lg">Đã duyệt</SelectItem>
            <SelectItem value="PARTIAL" className="rounded-lg">Nhận một phần</SelectItem>
          </SelectContent>
        </Select>

        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-slate-500 hover:text-rose-600"
            onClick={() => { setKeyword(""); setStatusFilter("ALL"); setPage(0); }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* PO Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-indigo-50/60 px-6 py-2 text-xs font-medium text-indigo-600 dark:border-slate-800 dark:bg-indigo-950/20 dark:text-indigo-400">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            Đang cập nhật…
          </div>
        )}
        <div className="overflow-x-auto">
          <Table className="min-w-[600px] text-left">
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                <TableHead className="py-3.5 pl-6 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã PO</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày đặt</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Dự kiến nhận</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                <TableHead className="py-3.5 pl-3 pr-6 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <TableCell className="py-4 pl-6 pr-3"><Skeleton className="h-4 w-32 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="py-4 pl-3 pr-6 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách PO"
                      description={apiErrMessage(error, "Lỗi mạng hoặc máy chủ từ chối.")}
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <EmptyState
                      icon={FileText}
                      title="Chưa có đơn nhập hàng nào"
                      description="Hệ thống chưa ghi nhận đơn mua hàng (PO) nào ở trạng thái Đã duyệt để bạn có thể bắt đầu nhập kho."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((po: PurchaseOrder) => (
                  <TableRow
                    key={po.id}
                    className="group border-b border-slate-50 last:border-0 hover:bg-indigo-50/40 dark:border-slate-800/60 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer"
                    onClick={() => onSelect(po.id)}
                  >
                    <TableCell className="py-4 pl-6 pr-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{po.poNumber}</span>
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-slate-600 dark:text-slate-400">{po.orderDate}</TableCell>
                    <TableCell className="px-3 py-4 text-sm text-slate-600 dark:text-slate-400">{po.expectedDate ?? "—"}</TableCell>
                    <TableCell className="px-3 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border",
                        po.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
                      )}>
                        {po.status === "APPROVED" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {PO_STATUS[po.status ?? ""] ?? po.status ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 pl-3 pr-6 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 px-3 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/30 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        onClick={(e) => { e.stopPropagation(); onSelect(po.id); }}
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Chọn
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationFooter
          itemLabel="đơn"
          rowsCount={rows.length}
          page={page}
          totalElements={totalElements}
          totalPages={totalPages}
          canGoPrev={page > 0}
          canGoNext={totalPages > 0 && page < totalPages - 1}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          errorText="Không tải được dữ liệu."
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          pageSize={20}
        />
      </div>
    </div>
  );
}

/* ── Step 2: GRN Form ─────────────────────────────────────────────── */
function GrnForm({ poId, onBack }: { poId: string; onBack: () => void }) {
  const router = useRouter();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const { data: detailRes, isLoading: detailLoading } = useGetPurchaseOrderDetailQuery(poId);
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
  const [lines, setLines] = useState<Record<string, { qty: string; note: string }>>({});

  const linesInit = useMemo(() => {
    const init: Record<string, { qty: string; note: string }> = {};
    for (const item of items) {
      const remain = Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (remain > 0) init[item.id] = { qty: "", note: "" };
    }
    return init;
  }, [items]);

  const mergedLines = useMemo(() => {
    const m = { ...linesInit };
    for (const [k, v] of Object.entries(lines)) {
      if (m[k]) m[k] = v;
    }
    return m;
  }, [linesInit, lines]);

  function setLine(id: string, field: "qty" | "note", val: string) {
    setLines((prev) => ({ ...prev, [id]: { ...mergedLines[id], [field]: val } }));
  }

  // Auto-focus first qty input
  useEffect(() => {
    if (!detailLoading) {
      setTimeout(() => firstInputRef.current?.focus(), 150);
    }
  }, [detailLoading]);

  const [createGrn, { isLoading: creating }] = useCreateInboundReceiptMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines = Object.entries(mergedLines)
      .map(([poItemId, v]) => {
        const qty = Number(v.qty.replace(",", "."));
        if (!qty || Number.isNaN(qty) || qty <= 0) return null;
        return { poItemId, receivedQty: qty, ...(v.note.trim() ? { note: v.note.trim() } : {}) };
      })
      .filter(Boolean) as { poItemId: string; receivedQty: number; note?: string }[];

    if (validLines.length === 0) {
      toast.error("Nhập số lượng ít nhất 1 dòng hàng");
      return;
    }

    for (const line of validLines) {
      const item = items.find((i) => i.id === line.poItemId);
      if (!item) continue;
      const remain = Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (line.receivedQty > remain) {
        toast.error(`${item.productSku}: số lượng nhập (${line.receivedQty}) vượt quá còn lại (${remain})`);
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
      toast.success(`Đã tạo phiếu nhập kho: ${res.data?.receiptNumber ?? "OK"}`);
      router.push(`/purchase-orders/${poId}`);
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  if (detailLoading)
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-16 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Đang tải chi tiết PO…</p>
      </div>
    );

  if (!po)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <EmptyState
          icon={AlertCircle}
          title="Không tải được chi tiết PO"
          description="Đơn nhập hàng không tồn tại hoặc đã bị xoá."
          action={<Button variant="outline" size="sm" onClick={onBack}>Quay lại</Button>}
          className="py-12"
        />
      </div>
    );

  const receivableItems = items.filter(
    (i) => Number(i.orderedQty ?? 0) - Number(i.receivedQty ?? 0) > 0,
  );

  const filledCount = Object.values(mergedLines).filter((v) => {
    const q = Number(v.qty.replace(",", "."));
    return q > 0 && !Number.isNaN(q);
  }).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* PO Info Banner */}
      <div className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white p-4 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-slate-900/20">
        <Button type="button" variant="outline" size="icon-sm" onClick={onBack} className="shrink-0 rounded-xl hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 border-slate-200">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white text-sm">{po.poNumber}</span>
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border",
              po.status === "APPROVED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50"
            )}>
              {po.status === "APPROVED" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {po.status === "APPROVED" ? "Đã duyệt" : "Nhận một phần"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ngày đặt: <span className="font-medium text-slate-700 dark:text-slate-300">{po.orderDate}</span> · Dự kiến: <span className="font-medium text-slate-700 dark:text-slate-300">{po.expectedDate ?? "—"}</span>
          </p>
        </div>
        {/* Progress */}
        <div className="text-right shrink-0 bg-white/60 dark:bg-slate-900/40 px-4 py-2 rounded-xl border border-white/40 dark:border-white/5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Đã điền</p>
          <p className="text-lg font-black text-indigo-700 dark:text-indigo-400 tabular-nums leading-none">
            {filledCount}<span className="text-xs font-semibold text-slate-400">/{receivableItems.length}</span>
          </p>
        </div>
      </div>

      {receivableItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            icon={CheckCircle2}
            title="Đã nhập đủ hàng"
            description="Tất cả dòng hàng đã nhập đủ. Không thể tạo phiếu nhập mới."
            action={<Button variant="outline" size="sm" onClick={onBack}>Quay lại</Button>}
            className="py-12"
          />
        </div>
      ) : (
        <>
          {/* Lines Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Building2 className="h-4 w-4 text-indigo-500" />
                Danh sách hàng hoá
                <Badge variant="secondary" className="ml-1 text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {receivableItems.length} dòng
                </Badge>
              </div>
              <p className="text-xs text-slate-400">Điền số lượng thực nhận cho từng dòng hàng</p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="py-3 pl-5 pr-3 w-10 text-[11px] font-bold uppercase tracking-wider text-slate-400">#</TableHead>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">SKU / Tên SP</TableHead>
                    <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">SL đặt</TableHead>
                    <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Đã nhận</TableHead>
                    <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Còn lại</TableHead>
                    <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 w-36">Nhập lần này ★</TableHead>
                    <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivableItems.map((item, idx) => {
                    const ordered = Number(item.orderedQty ?? 0);
                    const received = Number(item.receivedQty ?? 0);
                    const remain = Math.max(0, ordered - received);
                    const lineVal = mergedLines[item.id] ?? { qty: "", note: "" };
                    const enteredQty = Number(lineVal.qty.replace(",", "."));
                    const hasValue = enteredQty > 0 && !Number.isNaN(enteredQty);
                    const isOverMax = hasValue && enteredQty > remain;

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "border-b border-slate-50 last:border-0 dark:border-slate-800/60 transition-colors",
                          hasValue && !isOverMax && "bg-emerald-50/30 dark:bg-emerald-950/10",
                          isOverMax && "bg-rose-50/40 dark:bg-rose-950/10",
                        )}
                      >
                        <TableCell className="py-3 pl-5 pr-3 text-xs font-bold text-slate-400">{idx + 1}</TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400">{item.productSku}</span>
                            {item.productName && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">{item.productName}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">{ordered}</TableCell>
                        <TableCell className="px-3 py-3 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">{received}</TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">{remain}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <Input
                            ref={idx === 0 ? firstInputRef : undefined}
                            value={lineVal.qty}
                            onChange={(e) => setLine(item.id, "qty", e.target.value)}
                            inputMode="decimal"
                            placeholder={`≤ ${remain}`}
                            className={cn(
                              "w-28 text-right h-8 rounded-lg text-sm font-semibold tabular-nums",
                              "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20",
                              isOverMax && "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-950/20 dark:text-rose-400",
                              hasValue && !isOverMax && "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300",
                            )}
                          />
                          {isOverMax && (
                            <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">Vượt quá {remain}</p>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Input
                            value={lineVal.note}
                            onChange={(e) => setLine(item.id, "note", e.target.value)}
                            placeholder="Nguyên vẹn, xước..."
                            className="w-40 h-8 rounded-lg text-xs border-slate-200 dark:border-slate-700"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Location + Note Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Thông tin bổ sung</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Vị trí nhận hàng <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-400">Chọn khu vực hoặc dock tiếp nhận hàng</p>
                {locationOptions.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
                    Kho này chưa có vị trí nào. Vui lòng tạo vị trí cho kho trước khi nhập hàng.
                  </div>
                ) : (
                  <Select
                    value={locationId || "__empty__"}
                    onValueChange={(v) => setLocationId(!v || v === "__empty__" ? "" : v)}
                  >
                    <SelectTrigger className="rounded-xl h-10 border-slate-200 dark:border-slate-700">
                      <SelectValue>
                        {locationId
                          ? (locationOptions.find((l) => l.id === locationId)?.code ??
                            locationOptions.find((l) => l.id === locationId)?.name ??
                            locationId)
                          : <span className="text-slate-400">Chọn vị trí nhận hàng…</span>}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {locationOptions.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id} className="rounded-lg">
                          {loc.code ?? loc.name ?? loc.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Ghi chú chung <span className="text-slate-400 font-normal text-xs">(tuỳ chọn)</span>
                </label>
                <p className="text-xs text-slate-400">Ghi chú về lô hàng, sự cố, khiếu nại…</p>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Lô hàng xước 1 thùng, đã ghi nhận..."
                  rows={2}
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs text-slate-500">
              Đã điền <strong className="text-slate-800 dark:text-slate-200">{filledCount}</strong> / {receivableItems.length} dòng hàng
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" size="sm" onClick={onBack} className="rounded-xl">
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={creating}
                size="sm"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none gap-1.5"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                Tạo phiếu nhập kho
              </Button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function NewInboundReceiptPage() {
  const searchParams = useSearchParams();
  const initialPoId = searchParams.get("poId") ?? "";
  const [selectedPoId, setSelectedPoId] = useState(initialPoId);

  const step = selectedPoId ? 2 : 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tạo phiếu nhập kho"
        description={
          selectedPoId
            ? "Nhập số lượng thực nhận cho từng dòng hàng"
            : "Chọn đơn mua hàng (PO) đã duyệt để bắt đầu nhập kho"
        }
        actions={
          <div className="flex items-center gap-4">
            <StepIndicator step={step as 1 | 2} />
            <Button
              render={<Link href="/inbound" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Danh sách
            </Button>
          </div>
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
