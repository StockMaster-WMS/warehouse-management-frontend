"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ChevronRight,
  PackageCheck,
  SlidersHorizontal,
  PackageOpen,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { StatsGrid, type StatItem } from "@/components/ui/stats-grid";
import { PageHeader } from "@/components/page-header";
import { useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiErrMessage } from "@/types/api";
import {
  useCompletePutawayTaskMutation,
  useGetLocationsQuery,
  useGetPoItemByIdQuery,
  useGetPoItemsQuery,
  useGetPutawayTasksQuery,
  useLazyGetPutawayLocationSuggestionsQuery,
  usePatchPutawayTaskMutation,
} from "@/store/services/purchase-order.service";
import { useGetLocationsByIdsQuery } from "@/store/services/location.service";
import type { PoItem, PutawayTask } from "@/types/purchase-order";
import type { PutawayLocationSuggestion } from "@/types/putaway";
import type { Location, LocationOption } from "@/types/location";


const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Chờ xử lý",
    cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    icon: <Clock className="size-3" />,
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    icon: <ChevronRight className="size-3" />,
  },
  COMPLETED: {
    label: "Hoàn tất",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
    icon: <CheckCircle2 className="size-3" />,
  },
  CANCELLED: {
    label: "Đã hủy",
    cls: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900",
    icon: <XCircle className="size-3" />,
  },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="text-xs text-slate-400">{status}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}


const EMPTY_PUTAWAY_TASKS: PutawayTask[] = [];

function putawayErrorMessage(error: unknown) {
  const message = apiErrMessage(error);
  const normalized = message.toLowerCase();
  if (
    normalized.includes("không thuộc kho") ||
    normalized.includes("not belong") ||
    normalized.includes("invalid") ||
    normalized.includes("không hợp lệ") ||
    normalized.includes("vị trí") ||
    normalized.includes("same warehouse") ||
    normalized.includes("warehouse")
  ) {
    return "Vị trí xếp hàng không hợp lệ hoặc không thuộc kho của phiếu nhập.";
  }
  return message;
}

function shortId(value?: string | null) {
  return value ? value.slice(-8).toUpperCase() : "—";
}

function putawayTaskCode(task: PutawayTask) {
  return task.taskNumber || task.code || `PUT-${shortId(task.id)}`;
}

function putawaySourceLabel(task: PutawayTask) {
  return (
    task.receiptNumber ||
    task.inboundReceiptNumber ||
    task.poNumber ||
    task.purchaseOrderNumber ||
    null
  );
}

function putawayQuantity(task: PutawayTask, poItem?: PoItem) {
  const value =
    task.quantity ??
    task.putawayQty ??
    task.qty ??
    task.receivedQty ??
    task.poItem?.receivedQty ??
    poItem?.receivedQty;
  return value == null ? null : Number(value);
}

function locationLabel(loc: Location | LocationOption) {
  const optionalName = "name" in loc ? loc.name : undefined;
  return (
    loc.code ||
    optionalName ||
    `${loc.zone ?? ""}${loc.aisle ?? ""}-${loc.rack ?? ""}${loc.level != null ? "/" + loc.level : ""}${loc.bin ? "/" + loc.bin : ""}`
  );
}

function putawaySuggestionOption(suggestion: PutawayLocationSuggestion): SearchableSelectOption {
  const badges = [
    suggestion.currentSuggested ? "Vị trí hiện tại" : null,
    suggestion.existingProductLocation ? "Vị trí cũ của sản phẩm" : null,
    suggestion.emptyLocation ? "Vị trí trống" : null,
    Number(suggestion.qtyOnHand ?? 0) > 0 ? `Tồn: ${suggestion.qtyOnHand}` : null,
  ].filter(Boolean);
  const details = [
    suggestion.locationType,
    suggestion.zone ? `Zone ${suggestion.zone}` : null,
    ...badges,
  ].filter(Boolean);

  return {
    value: suggestion.locationId,
    label: suggestion.locationCode || suggestion.locationId,
    hint: details.length ? details.join(" · ") : suggestion.locationId,
  };
}

function isEligiblePutawayLocation(loc: Location | LocationOption, warehouseId?: string | null) {
  if (warehouseId && loc.warehouseId !== warehouseId) return false;
  if (loc.isActive === false) return false;
  const status = String(loc.status ?? "AVAILABLE").trim().toUpperCase();
  if (["BLOCKED", "MAINTENANCE", "INACTIVE", "DISABLED"].includes(status)) return false;
  const type = String(loc.locationType ?? "").trim().toUpperCase();
  return !type.startsWith("RMA_") && type !== "STAGING";
}

function locationSelectOption(loc: Location | LocationOption): SearchableSelectOption {
  const label = locationLabel(loc);
  const details = [
    loc.locationType,
    loc.zone ? `Zone ${loc.zone}` : null,
    loc.status,
  ].filter(Boolean);
  return {
    value: loc.id,
    label,
    hint: details.length ? details.join(" · ") : loc.id,
  };
}

function putawayProductInfo(task: PutawayTask, poItem?: PoItem) {
  const productSku =
    task.productSku ??
    task.productCode ??
    task.sku ??
    task.poItem?.productSku ??
    task.poItem?.sku ??
    task.poItem?.product?.productSku ??
    task.poItem?.product?.sku ??
    task.poItem?.product?.code ??
    poItem?.productSku ??
    "";
  const productName =
    task.productName ??
    task.poItem?.productName ??
    task.poItem?.product?.productName ??
    task.poItem?.product?.name ??
    poItem?.productName ??
    "";
  return {
    productSku,
    productName,
    quantity: putawayQuantity(task, poItem),
  };
}

function hasTaskProductInfo(task: PutawayTask) {
  const info = putawayProductInfo(task);
  return Boolean(info.productSku || info.productName);
}

function PutawayTaskRow({
  task,
  cachedPoItem,
  canCoordinatePutaway,
  patching,
  locationMap,
  onEdit,
  onComplete,
}: {
  task: PutawayTask;
  cachedPoItem?: PoItem;
  canCoordinatePutaway: boolean;
  patching: boolean;
  locationMap: Map<string, string>;
  onEdit: (task: PutawayTask) => void;
  onComplete: (task: PutawayTask) => void;
}) {
  const shouldLoadPoItem = Boolean(task.poItemId && !cachedPoItem && !hasTaskProductInfo(task));
  const { data: poItemDetailRes, isFetching: poItemFetching } = useGetPoItemByIdQuery(
    task.poItemId ?? "",
    { skip: !shouldLoadPoItem },
  );
  const poItem = cachedPoItem ?? poItemDetailRes?.data;
  const { productSku, productName, quantity } = putawayProductInfo(task, poItem);
  const sourceLabel = putawaySourceLabel(task);
  const canComplete = task.status === "PENDING" || task.status === "IN_PROGRESS";
  const canEdit = canCoordinatePutaway && canComplete;

  return (
    <TableRow
      className={cn(
        "group border-b border-slate-50 last:border-0 transition-colors dark:border-slate-800/60",
        task.status === "COMPLETED" && "opacity-60",
        task.status !== "COMPLETED" && "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
      )}
    >
      <TableCell className="py-4 pl-6 pr-3">
        <div className="space-y-1">
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {putawayTaskCode(task)}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            {sourceLabel ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {sourceLabel}
              </span>
            ) : null}
            <span>ID …{task.id.slice(-6)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-3 py-4">
        {productSku || productName ? (
          <div className="min-w-0 space-y-1">
            <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {productName || productSku}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {productSku && productName ? (
                <span className="font-mono font-semibold text-indigo-700 dark:text-indigo-400">{productSku}</span>
              ) : null}
              {quantity != null && Number.isFinite(quantity) ? (
                <span>SL: {quantity}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {poItemFetching ? "Đang tải sản phẩm..." : "Dòng nhập"}
            </span>
            <div className="font-mono text-xs text-slate-400">
              {task.poItemId ? `PO item …${task.poItemId.slice(-8)}` : "Chưa có mã dòng nhập"}
            </div>
          </div>
        )}
      </TableCell>
      <TableCell className="px-3 py-4">
        <StatusPill status={task.status} />
      </TableCell>
      <TableCell className="px-3 py-4">
        {task.suggestedLocationId ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
            <MapPin className="size-3 text-slate-400" />
            {locationMap.get(task.suggestedLocationId) ?? `…${task.suggestedLocationId.slice(-6)}`}
          </span>
        ) : <span className="text-slate-400 text-xs">—</span>}
      </TableCell>
      <TableCell className="px-3 py-4">
        {task.actualLocationId ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            {locationMap.get(task.actualLocationId) ?? `…${task.actualLocationId.slice(-6)}`}
          </span>
        ) : <span className="text-slate-400 text-xs">—</span>}
      </TableCell>
      <TableCell className="py-4 pl-3 pr-6 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {canCoordinatePutaway ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700"
              onClick={() => canEdit && onEdit(task)}
              disabled={patching || !canEdit}
            >
              Sửa
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className={cn(
              "h-8 px-2.5 text-xs rounded-lg gap-1",
              canComplete
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                : "opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700",
            )}
            onClick={() => canComplete && onComplete(task)}
            disabled={!canComplete}
          >
            <PackageCheck className="size-3.5" />
            Hoàn tất
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function PutawayPage() {
  const canCoordinatePutaway = useHasPermissions(ADMIN_MANAGER_ROLES);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetPutawayTasksQuery({
      page,
      size,
      ...(keyword.trim() ? { poItemId: keyword.trim() } : {}),
      ...(statusFilter.trim() ? { status: statusFilter.trim() } : {}),
    });

  const tasks = data?.data?.content ?? EMPTY_PUTAWAY_TASKS;
  const totalElements = data?.data?.total_elements ?? tasks.length;
  const totalPages = data?.data?.total_pages ?? 0;
  const visibleLocationIds = useMemo(() => {
    const ids = new Set<string>();
    for (const task of tasks) {
      if (task.suggestedLocationId?.trim()) ids.add(task.suggestedLocationId.trim());
      if (task.actualLocationId?.trim()) ids.add(task.actualLocationId.trim());
    }
    return Array.from(ids);
  }, [tasks]);

  /* ── Locations lookup ── */
  const { data: locationsRes } = useGetLocationsQuery({});
  const { data: visibleLocationsRes } = useGetLocationsByIdsQuery(visibleLocationIds, {
    skip: visibleLocationIds.length === 0,
  });
  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    const locations = [...(locationsRes?.data ?? []), ...(visibleLocationsRes?.data ?? [])];
    for (const loc of locations) {
      map.set(loc.id, locationLabel(loc));
    }
    return map;
  }, [locationsRes, visibleLocationsRes]);
  /* ── PO Items lookup ── */
  const { data: poItemsRes } = useGetPoItemsQuery(
    { size: 200 },
    { skip: tasks.length === 0 },
  );

  const poItemMap = useMemo(() => {
    const map = new Map<string, PoItem>();
    for (const item of poItemsRes?.data?.content ?? []) {
      map.set(item.id, item);
    }
    return map;
  }, [poItemsRes]);

  /* ── Dialog state ── */
  const [completeOpen, setCompleteOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<PutawayTask | null>(null);
  const [actualLocationId, setActualLocationId] = useState("");
  const [completeErrors, setCompleteErrors] = useState<Record<string, string>>({});

  const [editOpen, setEditOpen] = useState(false);
  const [editSuggested, setEditSuggested] = useState("");
  const [editStatus, setEditStatus] = useState<string>("PENDING");

  const [completeTask, { isLoading: completing }] = useCompletePutawayTaskMutation();
  const [patchTask, { isLoading: patching }] = usePatchPutawayTaskMutation();

  const [loadPutawaySuggestions, { data: putawaySuggestionsRes, isLoading: suggestionsLoading, isFetching: suggestionsFetching }] =
    useLazyGetPutawayLocationSuggestionsQuery();
  const putawaySuggestions = useMemo(() => putawaySuggestionsRes?.data ?? [], [putawaySuggestionsRes]);
  const putawayLocationOptions = useMemo<SearchableSelectOption[]>(() => {
    const byId = new Map<string, SearchableSelectOption>();
    for (const suggestion of putawaySuggestions) {
      byId.set(suggestion.locationId, putawaySuggestionOption(suggestion));
    }
    for (const location of locationsRes?.data ?? []) {
      if (isEligiblePutawayLocation(location, activeTask?.warehouseId)) {
        byId.set(location.id, byId.get(location.id) ?? locationSelectOption(location));
      }
    }
    return Array.from(byId.values()).sort((left, right) =>
      left.label.localeCompare(right.label, "vi", { sensitivity: "base" }),
    );
  }, [activeTask?.warehouseId, locationsRes, putawaySuggestions]);
  const putawayLocationIds = useMemo(
    () => new Set(putawayLocationOptions.map((item) => item.value)),
    [putawayLocationOptions],
  );

  async function loadSuggestionsForTask(task: PutawayTask) {
    try {
      const res = await loadPutawaySuggestions({ id: task.id, limit: 30 }).unwrap();
      const suggestions = res.data ?? [];
      return suggestions.find((item) => item.currentSuggested)?.locationId
        ?? suggestions.find((item) => item.locationId === task.suggestedLocationId)?.locationId
        ?? task.suggestedLocationId
        ?? "";
    } catch (err) {
      toast.error(putawayErrorMessage(err));
      return task.suggestedLocationId ?? "";
    }
  }

  async function openComplete(t: PutawayTask) {
    setActiveTask(t);
    setActualLocationId("");
    setCompleteErrors({});
    setCompleteOpen(true);
    const currentSuggested = await loadSuggestionsForTask(t);
    setActualLocationId(currentSuggested);
  }

  async function openEdit(t: PutawayTask) {
    if (t.status === "COMPLETED" || t.status === "CANCELLED") {
      toast.error("Không thể sửa nhiệm vụ đã hoàn tất hoặc đã hủy.");
      return;
    }
    setActiveTask(t);
    setEditSuggested(t.suggestedLocationId ?? "");
    setEditStatus(t.status === "IN_PROGRESS" ? "IN_PROGRESS" : "PENDING");
    setEditOpen(true);
    const currentSuggested = await loadSuggestionsForTask(t);
    setEditSuggested(currentSuggested);
  }


  async function submitComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask) return;
    setCompleteErrors({});

    const selectedLocationId = actualLocationId.trim();
    const suggestedLocationId =
      activeTask.suggestedLocationId?.trim() ||
      putawaySuggestions.find((item) => item.currentSuggested)?.locationId ||
      "";
    const suggestionIds = putawayLocationIds;

    if (!selectedLocationId && !suggestedLocationId) {
      setCompleteErrors({ actualLocationId: "Chọn vị trí thực tế hoặc cập nhật vị trí gợi ý trước khi hoàn tất." });
      return;
    }
    if (selectedLocationId && !suggestionIds.has(selectedLocationId)) {
      setCompleteErrors({ actualLocationId: "Chỉ được chọn vị trí trong danh sách backend gợi ý." });
      return;
    }

    const body = selectedLocationId && selectedLocationId !== suggestedLocationId
      ? { actualLocationId: selectedLocationId }
      : {};

    try {
      const res = await completeTask({
        id: activeTask.id,
        purchaseOrderId: activeTask.purchaseOrderId ?? undefined,
        body,
      }).unwrap();
      if (!res.success) {
        toast.error((res as { message?: string }).message || "Hoàn tất thất bại");
        return;
      }
      toast.success((res as { message?: string }).message || "Đã hoàn tất xếp hàng lên kệ");
      setCompleteOpen(false);
      refetch();
    } catch (err) {
      toast.error(putawayErrorMessage(err));
    }
  }


  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask) return;
    if (!canCoordinatePutaway) {
      toast.error("Bạn không có quyền thực hiện thao tác này.");
      return;
    }
    if (activeTask.status === "COMPLETED" || activeTask.status === "CANCELLED") {
      toast.error("Không thể sửa nhiệm vụ đã hoàn tất hoặc đã hủy.");
      return;
    }

    const nextSuggested = editSuggested.trim();
    const suggestionIds = putawayLocationIds;
    if (nextSuggested && !suggestionIds.has(nextSuggested)) {
      toast.error("Chỉ được chọn vị trí trong danh sách backend gợi ý.");
      return;
    }

    const body: { status: PutawayTask["status"]; suggestedLocationId?: string | null } = {
      status: editStatus === "IN_PROGRESS" ? "IN_PROGRESS" : "PENDING",
    };
    if (nextSuggested !== (activeTask.suggestedLocationId ?? "")) {
      body.suggestedLocationId = nextSuggested || null;
    }

    try {
      const res = await patchTask({
        id: activeTask.id,
        body,
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Cập nhật thất bại");
        return;
      }
      toast.success(res.message || "Đã cập nhật nhiệm vụ");
      setEditOpen(false);
      refetch();
    } catch (err) {
      toast.error(putawayErrorMessage(err));
    }
  }


  /* ── Quick stats ── */
  const stats = useMemo(() => ({
    total: totalElements,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  }), [tasks, totalElements]);

  const statsItems = useMemo<StatItem[]>(() => {
    const multiPage = totalPages > 1;

    return [
      {
        label: "Tổng nhiệm vụ",
        value: stats.total,
        icon: FileText,
        color: "text-indigo-500",
      },
      {
        label: multiPage ? "Chờ xử lý (trang này)" : "Chờ xử lý",
        value: stats.pending,
        icon: Clock,
        color: "text-amber-500",
      },
      {
        label: multiPage ? "Đang thực hiện (trang này)" : "Đang thực hiện",
        value: stats.inProgress,
        icon: Activity,
        color: "text-blue-500",
      },
      {
        label: multiPage ? "Hoàn tất (trang này)" : "Hoàn tất",
        value: stats.completed,
        icon: CheckCircle2,
        color: "text-emerald-500",
      },
    ];
  }, [stats, totalPages]);

  return (
    <div className="space-y-5 pb-16">
      <PageHeader
        title="Sắp xếp vào kho"
        description="Quản lý nhiệm vụ xếp hàng vào vị trí lưu kho."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 rounded-xl border-slate-200"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Làm mới
          </Button>
        }
      />

      <StatsGrid stats={statsItems} isLoading={isLoading} />

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SearchToolbar
          noContainer
          placeholder="Lọc theo mã dòng nhập (poItemId)..."
          value={keyword}
          onValueChange={(value) => {
            setKeyword(value);
            setPage(0);
          }}
          right={
            <>
              <TableRefreshButton isFetching={isFetching} onRefresh={() => refetch()} />
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => {
                  setStatusFilter(!value || value === "all" ? "" : value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-10 w-44 shrink-0 rounded-xl border-slate-200 dark:border-slate-700">
                  <SlidersHorizontal className="mr-1.5 size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-sm">
                    {statusFilter ? (STATUS_CONFIG[statusFilter]?.label ?? statusFilter) : "Tất cả trạng thái"}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">Tất cả</SelectItem>
                  <SelectItem value="PENDING" className="rounded-lg">Chờ xử lý</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="rounded-lg">Đang thực hiện</SelectItem>
                  <SelectItem value="COMPLETED" className="rounded-lg">Hoàn tất</SelectItem>
                  <SelectItem value="CANCELLED" className="rounded-lg">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              {(keyword || statusFilter) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-xs text-slate-500 hover:text-rose-600"
                  onClick={() => {
                    setKeyword("");
                    setStatusFilter("");
                    setPage(0);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </>
          }
        />

        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-indigo-50/60 px-6 py-2 text-xs font-medium text-indigo-600 dark:border-slate-800 dark:bg-indigo-950/20 dark:text-indigo-400">
            <div className="size-1.5 animate-pulse rounded-full bg-indigo-500" />
            Đang cập nhật dữ liệu…
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="min-w-[960px] text-left">
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                <TableHead className="py-3.5 pl-6 pr-3 w-44 text-[11px] font-bold uppercase tracking-wider text-slate-400">Nhiệm vụ</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sản phẩm</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí gợi ý</TableHead>
                <TableHead className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí thực tế</TableHead>
                <TableHead className="py-3.5 pl-3 pr-6 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <TableCell className="py-4 pl-6 pr-3"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-28 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="px-3 py-4"><Skeleton className="h-4 w-16 rounded" /></TableCell>
                    <TableCell className="py-4 pl-3 pr-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Skeleton className="h-8 w-12 rounded-lg" />
                        <Skeleton className="h-8 w-16 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách xếp hàng"
                      description={apiErrMessage(error)}
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                    />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <EmptyState
                      icon={PackageOpen}
                      title="Không có nhiệm vụ xếp hàng"
                      description={
                        canCoordinatePutaway
                          ? "Thử bỏ bộ lọc hoặc tạo phiếu nhập hàng từ đơn nhập trước."
                          : "Các nhiệm vụ xếp hàng theo luồng vận hành sẽ xuất hiện tại đây."
                      }
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Làm mới</Button>}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task: PutawayTask) => (
                  <PutawayTaskRow
                    key={task.id}
                    task={task}
                    cachedPoItem={task.poItemId ? poItemMap.get(task.poItemId) : undefined}
                    canCoordinatePutaway={canCoordinatePutaway}
                    patching={patching}
                    locationMap={locationMap}
                    onEdit={openEdit}
                    onComplete={openComplete}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationFooter
          itemLabel="nhiệm vụ xếp hàng"
          rowsCount={tasks.length}
          page={page}
          totalElements={totalElements}
          totalPages={totalPages}
          canGoPrev={page > 0}
          canGoNext={totalPages > 0 && page < totalPages - 1}
          isFetching={isFetching}
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          pageSize={size}
          onPageSizeChange={(nextSize) => {
            setSize(nextSize);
            setPage(0);
          }}
        />
      </div>

      {/* ── Complete Dialog ── */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={submitComplete}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageCheck className="size-5 text-indigo-600" />
                Hoàn tất xếp hàng lên kệ
              </DialogTitle>
              {activeTask && (
                <DialogDescription>
                  Nhiệm vụ <span className="font-mono font-semibold">PUT-{activeTask.id.slice(0, 8).toUpperCase()}</span> - xác nhận vị trí đặt hàng thực tế
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  Vị trí thực tế nếu khác gợi ý
                </label>
                <SearchableSelect
                  value={actualLocationId}
                  onValueChange={setActualLocationId}
                  options={putawayLocationOptions}
                  loading={suggestionsLoading || suggestionsFetching}
                  error={Boolean(completeErrors.actualLocationId)}
                  placeholder={activeTask?.suggestedLocationId ? "Dùng vị trí gợi ý hiện tại" : "Chọn vị trí thực tế"}
                  searchPlaceholder="Tìm theo mã vị trí, zone, aisle, rack..."
                  emptyText="Không có vị trí phù hợp cho nhiệm vụ này"
                  dialogTitle="Chọn vị trí đặt hàng thực tế"
                  icon={<MapPin className="size-4" />}
                />
                {completeErrors.actualLocationId && (
                  <p className="mt-1 text-xs text-rose-600">{completeErrors.actualLocationId}</p>
                )}
                <p className="mt-1.5 text-xs text-slate-400">Để trống nếu dùng vị trí gợi ý hiện tại. Nếu chọn vị trí khác, FE sẽ gửi actualLocationId cho backend.</p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCompleteOpen(false)} className="rounded-xl">
                Huỷ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={completing}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5"
              >
                {completing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Xác nhận hoàn tất
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      {canCoordinatePutaway ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <form onSubmit={submitEdit}>
              <DialogHeader>
                <DialogTitle>Cập nhật nhiệm vụ xếp hàng</DialogTitle>
                {activeTask && (
                  <DialogDescription>
                    Nhiệm vụ <span className="font-mono font-semibold">PUT-{activeTask.id.slice(0, 8).toUpperCase()}</span>
                  </DialogDescription>
                )}
              </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Trạng thái</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v ?? "PENDING")}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="PENDING" className="rounded-lg">Chờ xử lý</SelectItem>
                    <SelectItem value="IN_PROGRESS" className="rounded-lg">Đang thực hiện</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Vị trí gợi ý</label>
                <SearchableSelect
                  value={editSuggested}
                  onValueChange={setEditSuggested}
                  options={putawayLocationOptions}
                  loading={suggestionsLoading || suggestionsFetching}
                  placeholder="Chọn vị trí gợi ý"
                  searchPlaceholder="Tìm theo mã vị trí, zone, aisle, rack..."
                  emptyText="Không có vị trí phù hợp cho nhiệm vụ này"
                  dialogTitle="Chọn vị trí gợi ý"
                  icon={<MapPin className="size-4" />}
                />
                {editSuggested ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto px-0 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setEditSuggested("")}
                  >
                    Xóa vị trí gợi ý
                  </Button>
                ) : null}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(false)} className="rounded-xl">
                Huỷ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={patching}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5"
              >
                {patching ? <Loader2 className="size-4 animate-spin" /> : null}
                Lưu thay đổi
              </Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
