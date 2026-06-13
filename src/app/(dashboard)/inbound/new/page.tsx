"use client";

import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
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
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
import { apiErrMessage, apiErrStatus } from "@/types/api";
import type { PurchaseOrder } from "@/types/purchase-order";
import {
  useGetPurchaseOrderDetailQuery,
  useGetPurchaseOrdersQuery,
} from "@/store/services/purchase-order.service";
import {
  useCreateInboundReceiptMutation,
  useLazyGetInboundLocationSuggestionsQuery,
} from "@/store/services/inbound.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { InboundLocationSuggestion } from "@/types/inbound-receipt";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/design-system";

function inboundLocationOption(loc: InboundLocationSuggestion) {
  const zoneLabel = loc.zone ? ` - Zone ${loc.zone}` : "";
  const typeLabel = loc.locationType ?? "STORAGE";
  const stockQty = loc.qtyOnHand ?? 0;

  if (loc.existingProductLocation) {
    return {
      value: loc.locationId,
      label: `${loc.locationCode} - Đang có SP (${stockQty})${zoneLabel}`,
      hint: `Vị trí sẵn có của sản phẩm · ${typeLabel}`,
    };
  }

  return {
    value: loc.locationId,
    label: `${loc.locationCode} - ${typeLabel}${zoneLabel}`,
    hint: loc.emptyLocation
      ? "Vị trí trống"
      : `Vị trí phù hợp · Tồn hiện tại: ${stockQty}`,
  };
}

/* ── Step Indicator ─────────────────────────────────────────────────── */
function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { label: "Chọn đơn nhập", icon: <ClipboardList className="size-4" /> },
    { label: "Nhập số lượng", icon: <PackagePlus className="size-4" /> },
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
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
              done && "text-success",
              active && "bg-primary text-primary-foreground shadow-sm",
              !done && !active && "text-muted-foreground/65",
            )}>
              <span className={cn(
                "flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                done && "bg-success-soft text-success-foreground",
                active && "bg-primary-foreground/20 text-primary-foreground",
                !done && !active && "bg-muted text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="size-3.5" /> : num}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "mx-1 h-px w-8 transition-colors",
                done ? "bg-success/40" : "bg-border"
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
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const debouncedKeyword = useDebouncedValue(keyword, 350);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetPurchaseOrdersQuery({
      page,
      size: pageSize,
      ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
      ...(debouncedKeyword.trim() ? { keyword: debouncedKeyword.trim() } : {}),
      sort: "createdAt",
      sortDir: "desc",
    });

  const rows = (data?.data?.content ?? []).filter((po) => po.status === "APPROVED" || po.status === "PARTIAL");
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
      <div className="ui-surface flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-44">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            placeholder="Tìm theo mã đơn nhập..."
            className="h-9 rounded-lg pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v ?? "ALL"); setPage(0); }}
        >
          <SelectTrigger className="h-9 w-44 shrink-0 whitespace-nowrap rounded-lg">
            <div className="flex items-center gap-1.5 truncate text-sm">
              <SlidersHorizontal className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {statusFilter === "ALL" ? "Tất cả trạng thái" : PO_STATUS[statusFilter] ?? statusFilter}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="ALL" className="rounded-lg">Tất cả</SelectItem>
            <SelectItem value="APPROVED" className="rounded-lg">Đã duyệt</SelectItem>
            <SelectItem value="PARTIAL" className="rounded-lg">Nhận một phần</SelectItem>
          </SelectContent>
        </Select>

        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => { setKeyword(""); setStatusFilter("ALL"); setPage(0); }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* PO Table */}
      <div className="ui-surface overflow-hidden">
        {isFetching && !isLoading && (
          <div className="ui-updating-banner flex items-center gap-2">
            <div className="size-1.5 animate-pulse rounded-full bg-primary" />
            Đang cập nhật…
          </div>
        )}
        <div className="overflow-x-auto">
          <Table className="min-w-[600px] text-left">
            <TableHeader className="ui-table-header">
              <TableRow>
                <TableHead className="ui-label py-3.5 pl-6 pr-3">Mã đơn nhập</TableHead>
                <TableHead className="ui-label px-3 py-3.5">Ngày đặt</TableHead>
                <TableHead className="ui-label px-3 py-3.5">Dự kiến nhận</TableHead>
                <TableHead className="ui-label px-3 py-3.5">Trạng thái</TableHead>
                <TableHead className="ui-label py-3.5 pl-3 pr-6 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="ui-table-row">
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
                      title="Không tải được danh sách đơn nhập"
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
                      description="Hệ thống chưa ghi nhận đơn nhập nào ở trạng thái Đã duyệt để bạn có thể bắt đầu nhập kho."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((po: PurchaseOrder) => (
                  <TableRow
                    key={po.id}
                    className="ui-table-row group cursor-pointer last:border-0"
                    onClick={() => onSelect(po.id)}
                  >
                    <TableCell className="py-4 pl-6 pr-3">
                      <span className="font-semibold text-foreground">{po.poNumber}</span>
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-muted-foreground">{po.orderDate}</TableCell>
                    <TableCell className="px-3 py-4 text-sm text-muted-foreground">{po.expectedDate ?? "—"}</TableCell>
                    <TableCell className="px-3 py-4">
                      <StatusBadge tone={statusTone(po.status)}>
                        {PO_STATUS[po.status ?? ""] ?? po.status ?? "—"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="py-4 pl-3 pr-6 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 px-3 text-xs font-semibold opacity-0 transition-all group-hover:opacity-100 focus:opacity-100"
                        onClick={(e) => { e.stopPropagation(); onSelect(po.id); }}
                      >
                        <PackagePlus className="size-3.5" />
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
          pageSize={pageSize}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(0);
          }}
        />
      </div>
    </div>
  );
}

/* ── Step 2: GRN Form ─────────────────────────────────────────────── */
function GrnForm({ poId, onBack }: { poId: string; onBack: () => void }) {
  const { push } = useRouter();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const { data: detailRes, isLoading: detailLoading } = useGetPurchaseOrderDetailQuery(poId);
  const detail = detailRes?.data;
  const po = detail?.purchaseOrder;
  const items = useMemo(() => detail?.items ?? [], [detail?.items]);

  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Record<string, { qty: string; note: string; locationId: string }>>({});
  const [locationSuggestions, setLocationSuggestions] = useState<Record<string, InboundLocationSuggestion[]>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});
  const [loadLocationSuggestions] = useLazyGetInboundLocationSuggestionsQuery();

  const linesInit = useMemo(() => {
    const init: Record<string, { qty: string; note: string; locationId: string }> = {};
    for (const item of items) {
      const remain = Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (remain > 0) init[item.id] = { qty: "", note: "", locationId: "" };
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

  function setLine(id: string, field: "qty" | "note" | "locationId", val: string) {
    setLines((prev) => ({ ...prev, [id]: { ...mergedLines[id], [field]: val } }));
  }

  async function loadLineLocations(itemId: string) {
    if (!itemId || locationSuggestions[itemId]?.length || loadingSuggestions[itemId]) {
      return;
    }
    setLoadingSuggestions((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await loadLocationSuggestions({
        poItemId: itemId,
        limit: 20,
      }).unwrap();
      setLocationSuggestions((prev) => ({ ...prev, [itemId]: res.data ?? [] }));
      if ((res.data ?? []).length === 0) {
        console.info("Không có vị trí phù hợp cho poItemId", itemId);
      }
    } catch (err) {
      toast.error(apiErrMessage(err, "Không tải được gợi ý vị trí nhập hàng"));
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  function locationSuggestionOptions(itemId: string) {
    const suggestions = locationSuggestions[itemId] ?? [];
    if (suggestions.length === 0) {
      return [];
    }

    return [...suggestions]
      .sort((left, right) => Number(Boolean(right.existingProductLocation)) - Number(Boolean(left.existingProductLocation)))
      .map(inboundLocationOption);
  }

  // Auto-focus first qty input
  useEffect(() => {
    if (!detailLoading) {
      const focusTimer = window.setTimeout(() => firstInputRef.current?.focus(), 150);
      return () => window.clearTimeout(focusTimer);
    }
  }, [detailLoading]);

  const [createGrn, { isLoading: creating }] = useCreateInboundReceiptMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines: { poItemId: string; receivedQty: number; locationId: string; note?: string }[] = [];
    const itemsById = new Map(items.map((item) => [item.id, item]));
    for (const [poItemId, value] of Object.entries(mergedLines)) {
      const qty = Number(value.qty.replace(",", "."));
      if (!qty || Number.isNaN(qty) || qty <= 0) continue;
      if (!value.locationId?.trim()) {
        const item = itemsById.get(poItemId);
        toast.error(`Vui lòng chọn vị trí nhập cho ${item?.productSku ?? "dòng hàng"}`);
        return;
      }
      validLines.push({
        poItemId,
        receivedQty: qty,
        locationId: value.locationId.trim(),
        ...(value.note.trim() ? { note: value.note.trim() } : {}),
      });
    }

    if (validLines.length === 0) {
      toast.error("Nhập số lượng ít nhất 1 dòng hàng");
      return;
    }

    for (const line of validLines) {
      const item = itemsById.get(line.poItemId);
      if (!item) continue;
      const remain = Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (line.receivedQty > remain) {
        toast.error(`${item.productSku}: số lượng nhập (${line.receivedQty}) vượt quá còn lại (${remain})`);
        return;
      }
    }

    try {
      const res = await createGrn({
        purchaseOrderId: poId,
        locationId: null,
        ...(note.trim() ? { note: note.trim() } : {}),
        items: validLines,
      }).unwrap();

      if (!res.success) {
        toast.error(res.message || "Tạo phiếu nhập kho thất bại");
        return;
      }
      toast.success(`Đã tạo phiếu nhập kho: ${res.data?.receiptNumber ?? "OK"}`);
      push(`/purchase-orders/${poId}`);
    } catch (err) {
      toast.error(
        apiErrStatus(err) === 403 || apiErrStatus(err) === "403"
          ? "Bạn chưa được phân quyền thao tác kho của đơn nhập này"
          : apiErrMessage(err),
      );
    }
  }

  if (detailLoading)
    return (
      <div className="ui-surface flex flex-col items-center justify-center gap-3 p-16 text-muted-foreground">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-sm font-medium">Đang tải chi tiết đơn nhập…</p>
      </div>
    );

  if (!po)
    return (
      <div className="ui-surface">
        <EmptyState
          icon={AlertCircle}
          title="Không tải được chi tiết đơn nhập"
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
      <div className="ui-surface flex items-center gap-4 p-4">
        <Button type="button" variant="outline" size="icon-sm" onClick={onBack} className="shrink-0 rounded-lg">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{po.poNumber}</span>
            <StatusBadge tone={statusTone(po.status)}>
              {po.status === "APPROVED" ? "Đã duyệt" : "Nhận một phần"}
            </StatusBadge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ngày đặt: <span className="font-medium text-foreground">{po.orderDate}</span> · Dự kiến: <span className="font-medium text-foreground">{po.expectedDate ?? "—"}</span>
          </p>
        </div>
        <div className="ui-muted-surface shrink-0 px-4 py-2 text-right">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Đã điền</p>
          <p className="text-lg font-black leading-none tabular-nums text-primary">
            {filledCount}<span className="text-xs font-semibold text-muted-foreground">/{receivableItems.length}</span>
          </p>
        </div>
      </div>

      {receivableItems.length === 0 ? (
        <div className="ui-surface">
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
          <div className="ui-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="size-4 text-primary" />
                Danh sách hàng hoá
                <StatusBadge dot={false} tone="neutral" className="ml-1">
                  {receivableItems.length} dòng
                </StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground">Điền số lượng thực nhận cho từng dòng hàng</p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="ui-table-header">
                  <TableRow>
                    <TableHead className="ui-label w-10 py-3 pl-5 pr-3">#</TableHead>
                    <TableHead className="ui-label p-3">Mã hàng / tên sản phẩm</TableHead>
                    <TableHead className="ui-label p-3 text-right">SL đặt</TableHead>
                    <TableHead className="ui-label p-3 text-right">Đã nhận</TableHead>
                    <TableHead className="ui-label p-3 text-right">Còn lại</TableHead>
                    <TableHead className="ui-label w-36 p-3 text-right">Nhập lần này ★</TableHead>
                    <TableHead className="ui-label min-w-56 p-3">Vị trí nhập ★</TableHead>
                    <TableHead className="ui-label p-3">Ghi chú</TableHead>
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
                          "ui-table-row last:border-0",
                          hasValue && !isOverMax && "bg-success-soft/50",
                          isOverMax && "bg-danger-soft/50",
                        )}
                      >
                        <TableCell className="py-3 pl-5 pr-3 text-xs font-bold text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="p-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs font-semibold text-primary">{item.productSku}</span>
                            {item.productName && (
                              <span className="text-xs text-muted-foreground">{item.productName}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-right text-sm tabular-nums text-muted-foreground">{ordered}</TableCell>
                        <TableCell className="p-3 text-right text-sm tabular-nums text-muted-foreground">{received}</TableCell>
                        <TableCell className="p-3 text-right">
                          <span className="text-sm font-semibold tabular-nums text-foreground">{remain}</span>
                        </TableCell>
                        <TableCell className="p-3 text-right">
                          <Input
                            ref={idx === 0 ? firstInputRef : undefined}
                            value={lineVal.qty}
                            onChange={(e) => setLine(item.id, "qty", e.target.value)}
                            inputMode="decimal"
                            placeholder={`≤ ${remain}`}
                            className={cn(
                              "h-8 w-28 rounded-lg text-right text-sm font-semibold tabular-nums",
                              isOverMax && "border-destructive bg-danger-soft text-destructive",
                              hasValue && !isOverMax && "border-success bg-success-soft text-success-foreground",
                            )}
                          />
                          {isOverMax && (
                            <p className="mt-1 text-[10px] text-destructive">Vượt quá {remain}</p>
                          )}
                        </TableCell>
                        <TableCell className="p-3">
                          <SearchableSelect
                            options={locationSuggestionOptions(item.id)}
                            value={lineVal.locationId}
                            onValueChange={(locationId) => setLine(item.id, "locationId", locationId)}
                            onOpenChange={(open) => {
                              if (open) void loadLineLocations(item.id);
                            }}
                            placeholder="Chọn vị trí nhập..."
                            searchPlaceholder="Tìm mã vị trí..."
                            emptyText="Không có vị trí phù hợp trong kho của đơn nhập này"
                            dialogTitle={`Chọn vị trí nhập cho ${item.productSku}`}
                            loading={Boolean(loadingSuggestions[item.id])}
                            disabled={!po?.warehouseId}
                            className={cn(
                              "h-8 rounded-lg text-xs",
                              hasValue && !lineVal.locationId && "border-destructive ring-1 ring-destructive/30",
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-3">
                          <Input
                            value={lineVal.note}
                            onChange={(e) => setLine(item.id, "note", e.target.value)}
                            placeholder="Nguyên vẹn, xước..."
                            className="h-8 w-40 rounded-lg text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="ui-surface p-5">
            <p className="ui-label mb-4">Thông tin bổ sung</p>
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Ghi chú chung <span className="text-xs font-normal text-muted-foreground">(tuỳ chọn)</span>
                </label>
                <p className="text-xs text-muted-foreground">Ghi chú về lô hàng, sự cố, khiếu nại…</p>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Lô hàng xước 1 thùng, đã ghi nhận..."
                  rows={2}
                  className="resize-none rounded-lg text-sm"
                />
            </div>
          </div>

          <div className="ui-muted-surface flex items-center justify-between px-5 py-3.5">
            <p className="text-xs text-muted-foreground">
              Đã điền <strong className="text-foreground">{filledCount}</strong> / {receivableItems.length} dòng hàng
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" size="sm" onClick={onBack} className="rounded-lg">
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={creating}
                size="sm"
                className="gap-1.5 rounded-lg"
              >
                {creating ? <Loader2 className="size-4 animate-spin" /> : <PackagePlus className="size-4" />}
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
function NewInboundReceiptContent() {
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
            : "Chọn đơn nhập đã duyệt để bắt đầu nhập kho"
        }
        actions={
          <div className="flex items-center gap-4">
            <StepIndicator step={step as 1 | 2} />
            <Button
              render={<Link href="/inbound" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg text-xs"
            >
              <ArrowLeft className="size-3.5" />
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

export default function NewInboundReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <NewInboundReceiptContent />
    </Suspense>
  );
}
