"use client";

import React, { Dispatch, useMemo, useReducer } from "react";
// removed card imports
import { type PickingItem } from "@/types/picking-item";
import { Archive, Eye, MapPin, ChevronDown, ChevronRight, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import {
    DEFAULT_OPERATION_DATE_PRESET,
    getOperationDateRange,
    operationDatePresetLabel,
    type OperationDatePreset,
} from "@/lib/date-range";
import { statusTone } from "@/lib/design-system";
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useGetPickingItemsQuery, useGetPickingItemByIdQuery } from "@/store/services/picking-item.service";

interface GroupedPicking {
    soNumber: string;
    items: PickingItem[];
    progress: number;
    totalToPick: number;
    totalPicked: number;
    status: "PENDING" | "PARTIAL" | "PICKED";
}

type OverviewState = {
    searchTerm: string;
    selectedId: string | null;
    expandedGroups: Record<string, boolean>;
    advancedOpen: boolean;
    page: number;
    pageSize: number;
    status: "all" | "PENDING" | "PICKED";
    datePreset: OperationDatePreset;
};

const INITIAL_OVERVIEW_STATE: OverviewState = {
    searchTerm: "",
    selectedId: null,
    expandedGroups: {},
    advancedOpen: false,
    page: 0,
    pageSize: 20,
    status: "PENDING",
    datePreset: DEFAULT_OPERATION_DATE_PRESET,
};

function overviewReducer(state: OverviewState, patch: Partial<OverviewState>) {
    return { ...state, ...patch };
}

function looksLikeUuid(value?: string | null) {
    return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));
}

function displayPickingLocation(item: PickingItem) {
    if (!item.locationCode || looksLikeUuid(item.locationCode)) {
        return "Vị trí chưa xác định";
    }
    return item.locationCode;
}

export function OverviewTab() {
    const [state, dispatch] = useReducer(overviewReducer, INITIAL_OVERVIEW_STATE);
    const { searchTerm, selectedId, expandedGroups, advancedOpen, page, pageSize, status, datePreset } = state;
    const dateRange = useMemo(() => getOperationDateRange(datePreset), [datePreset]);

    const { data, isLoading, isFetching, isError } = useGetPickingItemsQuery({
        page,
        size: pageSize,
        status: status === "all" ? undefined : status,
        ...dateRange,
    });

    const { data: detailData, isFetching: isDetailLoading } = useGetPickingItemByIdQuery(
        selectedId as string,
        { skip: !selectedId }
    );

    const { groupedData } = useMemo(() => {
        const rawItems = data?.data?.content || [];

        // 1. Calculate Global Stats
        const pendingCount = rawItems.filter(i => i.status === "PENDING").length;
        const pickedCount = rawItems.filter(i => i.status === "PICKED").length;
        const uniqueSOsCount = new Set(rawItems.map(i => i.salesOrderNumber || "Chưa gắn đơn")).size;

        // 2. Filter by search
        let filtered = [...rawItems];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.salesOrderNumber?.toLowerCase().includes(s) ||
                item.productSku?.toLowerCase().includes(s) ||
                item.productName?.toLowerCase().includes(s) ||
                displayPickingLocation(item).toLowerCase().includes(s) ||
                item.id.toLowerCase().includes(s)
            );
        }

        // 3. Group and Consolidate
        const groups: Record<string, GroupedPicking> = {};

        filtered.forEach(item => {
            const soKey = item.salesOrderNumber || "Chưa gắn đơn";
            if (!groups[soKey]) {
                groups[soKey] = {
                    soNumber: soKey,
                    items: [],
                    progress: 0,
                    totalToPick: 0,
                    totalPicked: 0,
                    status: "PENDING"
                };
            }

            const group = groups[soKey];

            // CONSOLIDATION LOGIC: Find existing item with same Product + Location in this SO
            const existing = group.items.find(i =>
                i.productId === item.productId &&
                (i.locationId === item.locationId || i.locationCode === item.locationCode)
            );

            if (existing) {
                existing.qtyToPick += item.qtyToPick;
                existing.qtyPicked = (existing.qtyPicked || 0) + (item.qtyPicked || 0);
            } else {
                group.items.push({ ...item });
            }
        });

        // 4. Calculate group progress and sort items by pick path
        const result: GroupedPicking[] = Object.values(groups).map(g => {
            let totalToPickGroup = 0;
            let totalPickedGroup = 0;

            g.items.forEach(i => {
                totalToPickGroup += i.qtyToPick;
                totalPickedGroup += (i.qtyPicked || 0);
            });

            // Sort internal items by smart path
            g.items.sort((a, b) => {
                const zoneA = a.zone || "";
                const zoneB = b.zone || "";
                if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);
                const aisleA = a.aisle || "";
                const aisleB = b.aisle || "";
                if (aisleA !== aisleB) return aisleA.localeCompare(aisleB);
                return (a.locationCode || "").localeCompare(b.locationCode || "");
            });

            const progress = totalToPickGroup > 0 ? (totalPickedGroup / totalToPickGroup) * 100 : 0;
            const status = progress === 0 ? "PENDING" : progress === 100 ? "PICKED" : "PARTIAL";

            return { ...g, totalToPick: totalToPickGroup, totalPicked: totalPickedGroup, progress, status };
        });

        // Sort groups: Partial/Pending first
        result.sort((a, b) => {
            if (a.status !== b.status) {
                if (a.status === "PARTIAL") return -1;
                if (b.status === "PARTIAL") return 1;
                if (a.status === "PENDING") return -1;
                return 1;
            }
            return a.soNumber.localeCompare(b.soNumber);
        });

        return {
            groupedData: result,
            stats: { pending: pendingCount, picked: pickedCount, sos: uniqueSOsCount }
        };
    }, [data, searchTerm]);

    const toggleGroup = (so: string) => {
        dispatch({ expandedGroups: { ...expandedGroups, [so]: !expandedGroups[so] } });
    };

    const detailItem = detailData?.data;
    const totalElements = data?.data?.total_elements ?? 0;
    const totalPages = data?.data?.total_pages ?? 0;
    const rowsCount = data?.data?.content?.length ?? 0;
    const hasAnyFilter = Boolean(searchTerm.trim() || status !== "all" || datePreset !== DEFAULT_OPERATION_DATE_PRESET);
    const activeFilterCount =
        (status !== "all" ? 1 : 0) +
        (datePreset !== DEFAULT_OPERATION_DATE_PRESET ? 1 : 0) +
        (searchTerm.trim() ? 1 : 0);

    return (
        <div className="space-y-6">
            <div className="ui-surface flex flex-col overflow-hidden transition-all duration-300">
                <SearchToolbar
                    noContainer
                    placeholder="Tìm theo đơn hàng, SKU, vị trí…"
                    value={searchTerm}
                    onValueChange={(searchTerm) => dispatch({ searchTerm, page: 0 })}
                    right={
                        <AdvancedFilterActions
                            open={advancedOpen}
                            onToggle={() => dispatch({ advancedOpen: !advancedOpen })}
                            activeCount={activeFilterCount}
                            hasAnyFilter={hasAnyFilter}
                            onClear={() => dispatch({
                                searchTerm: "",
                                status: "PENDING",
                                datePreset: DEFAULT_OPERATION_DATE_PRESET,
                                page: 0,
                            })}
                        />
                    }
                />
                <PickingAdvancedFilters
                    open={advancedOpen}
                    status={status}
                    onStatusChange={(status) => dispatch({ status, page: 0 })}
                    datePreset={datePreset}
                    onDatePresetChange={(datePreset) => dispatch({ datePreset, page: 0 })}
                />

                <PickingOverviewTable
                    expandedGroups={expandedGroups}
                    groupedData={groupedData}
                    isLoading={isLoading}
                    onDispatch={dispatch}
                    onToggleGroup={toggleGroup}
                />
                <PaginationFooter
                    itemLabel="dòng lấy hàng"
                    rowsCount={rowsCount}
                    page={page}
                    totalElements={totalElements}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    canGoPrev={page > 0}
                    canGoNext={totalPages > 0 && page < totalPages - 1}
                    isLoading={isLoading}
                    isError={isError}
                    isFetching={isFetching}
                    onPrevPage={() => dispatch({ page: Math.max(0, page - 1) })}
                    onNextPage={() => dispatch({ page: page + 1 })}
                    onPageSizeChange={(pageSize) => dispatch({ pageSize, page: 0 })}
                />
            </div>

            <PickingDetailDialog
                detailItem={detailItem}
                isDetailLoading={isDetailLoading}
                open={!!selectedId}
                onOpenChange={(open) => !open && dispatch({ selectedId: null })}
            />
        </div>
    );
}

function PickingAdvancedFilters({
    open,
    status,
    onStatusChange,
    datePreset,
    onDatePresetChange,
}: {
    open: boolean;
    status: OverviewState["status"];
    onStatusChange: (status: OverviewState["status"]) => void;
    datePreset: OperationDatePreset;
    onDatePresetChange: (datePreset: OperationDatePreset) => void;
}) {
    const statusLabel: Record<OverviewState["status"], string> = {
        all: "Tất cả trạng thái",
        PENDING: "Chờ lấy",
        PICKED: "Đã lấy",
    };

    return (
        <AdvancedFilterPanel open={open}>
            <div className="min-w-52 space-y-1">
                <p className="ui-label">Thời gian</p>
                <Select value={datePreset} onValueChange={(value) => onDatePresetChange(value as OperationDatePreset)}>
                    <SelectTrigger className="h-10 rounded-lg bg-background">
                        <span className="truncate text-sm">{operationDatePresetLabel(datePreset)}</span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">{operationDatePresetLabel("today")}</SelectItem>
                        <SelectItem value="7d">{operationDatePresetLabel("7d")}</SelectItem>
                        <SelectItem value="30d">{operationDatePresetLabel("30d")}</SelectItem>
                        <SelectItem value="all">{operationDatePresetLabel("all")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="min-w-52 space-y-1">
                <p className="ui-label">Trạng thái lấy hàng</p>
                <Select value={status} onValueChange={(value) => onStatusChange(value as OverviewState["status"])}>
                    <SelectTrigger className="h-10 rounded-lg bg-background">
                        <span className="truncate text-sm">{statusLabel[status]}</span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="PENDING">Chờ lấy</SelectItem>
                        <SelectItem value="PICKED">Đã lấy</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </AdvancedFilterPanel>
    );
}

function PickingOverviewTable({
    expandedGroups,
    groupedData,
    isLoading,
    onDispatch,
    onToggleGroup,
}: {
    expandedGroups: Record<string, boolean>;
    groupedData: GroupedPicking[];
    isLoading: boolean;
    onDispatch: Dispatch<Partial<OverviewState>>;
    onToggleGroup: (so: string) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="ui-table-header">
                    <TableRow>
                        <TableHead className="ui-label w-12 p-3 text-center"></TableHead>
                        <TableHead className="ui-label p-3">Chi tiết Pick</TableHead>
                        <TableHead className="ui-label p-3">Vị trí kho</TableHead>
                        <TableHead className="ui-label p-3 text-center">Tiến độ</TableHead>
                        <TableHead className="ui-label p-3 text-center">Trạng thái</TableHead>
                        <TableHead className="ui-label w-[120px] p-3 pr-6 text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <PickingLoadingRow />
                    ) : groupedData.length === 0 ? (
                        <PickingEmptyRow />
                    ) : (
                        groupedData.map((group) => (
                            <PickingGroupRows
                                key={group.soNumber}
                                expanded={expandedGroups[group.soNumber] === true}
                                group={group}
                                onDispatch={onDispatch}
                                onToggleGroup={onToggleGroup}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function PickingLoadingRow() {
    return (
        <TableRow>
            <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2 animate-pulse">
                    <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="font-semibold text-xs uppercase tracking-widest">Đang tải dữ liệu…</span>
                </div>
            </TableCell>
        </TableRow>
    );
}

function PickingEmptyRow() {
    return (
        <TableRow>
            <TableCell colSpan={6} className="p-0">
                <EmptyState
                    icon={Package2}
                    title="Không tìm thấy dữ liệu picking"
                    description="Thử đổi từ khóa tìm kiếm hoặc kiểm tra danh sách lệnh lấy hàng."
                    className="py-12"
                />
            </TableCell>
        </TableRow>
    );
}

function PickingGroupRows({
    expanded,
    group,
    onDispatch,
    onToggleGroup,
}: {
    expanded: boolean;
    group: GroupedPicking;
    onDispatch: Dispatch<Partial<OverviewState>>;
    onToggleGroup: (so: string) => void;
}) {
    return (
        <React.Fragment>
            <TableRow className="ui-table-row group cursor-pointer" onClick={() => onToggleGroup(group.soNumber)}>
                <TableCell className="pl-4">
                    {expanded ? <ChevronDown className="size-4 text-primary" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                </TableCell>
                <TableCell colSpan={2} className="py-4">
                    <div className="flex flex-col">
                        <span className="ui-label mb-1 leading-none">Đơn hàng</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black tabular-nums tracking-tight text-foreground">{group.soNumber}</span>
                            <StatusBadge dot={false} tone="neutral" className="h-4 px-1 text-[9px]">
                                {group.items.length} SKU
                            </StatusBadge>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-center">
                    <PickingGroupProgress group={group} />
                </TableCell>
                <TableCell className="text-center">
                    <StatusBadge tone={statusTone(group.status)}>
                        {group.status === "PICKED" ? "Hoàn tất" : group.status === "PARTIAL" ? "Đang lấy" : "Chờ lấy"}
                    </StatusBadge>
                </TableCell>
                <TableCell className="text-right pr-6 flex justify-end gap-2 items-center">
                    <span className="text-[11px] font-bold text-muted-foreground">Điều phối qua tuyến pick</span>
                </TableCell>
            </TableRow>

            {expanded
                ? group.items.map((item) => (
                    <PickingItemRow key={item.id} item={item} onDispatch={onDispatch} />
                ))
                : null}
        </React.Fragment>
    );
}

function PickingGroupProgress({ group }: { group: GroupedPicking }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
                <span className="text-xs font-black tabular-nums text-foreground">{group.totalPicked}/{group.totalToPick}</span>
                <span
                    className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold",
                        group.progress === 100 ? "bg-success-soft text-success-foreground" : "bg-info-soft text-info-foreground font-black",
                    )}
                >
                    {Math.round(group.progress)}%
                </span>
            </div>
            <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                <div
                    className={cn("h-full transition-all duration-700", group.progress === 100 ? "bg-success" : "bg-primary")}
                    style={{ width: `${group.progress}%` }}
                />
            </div>
        </div>
    );
}

function PickingItemRow({
    item,
    onDispatch,
}: {
    item: PickingItem;
    onDispatch: Dispatch<Partial<OverviewState>>;
}) {
    return (
        <TableRow className="ui-table-row group/row animate-in fade-in slide-in-from-left-2 duration-300">
            <TableCell className="pl-6"></TableCell>
            <TableCell className="py-4 pl-4">
                <div className="flex flex-col">
                    <span className="text-[13px] font-black uppercase tracking-tight text-foreground">{item.productSku}</span>
                    <span className="mt-0.5 line-clamp-1 max-w-[250px] text-[11px] font-medium text-muted-foreground">{item.productName}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <div className="inline-flex items-center gap-1.5 rounded bg-info-soft px-2 py-1 font-mono text-xs font-black text-info-foreground ring-1 ring-inset ring-info/20">
                        <MapPin className="size-3" />
                        {displayPickingLocation(item)}
                    </div>
                    {item.zone ? <span className="mt-1 pl-1 text-[10px] font-bold capitalize text-muted-foreground">{item.zone} - {item.aisle}</span> : null}
                </div>
            </TableCell>
            <TableCell className="text-center">
                <div className="flex flex-col items-center">
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold tabular-nums text-foreground ring-1 ring-border shadow-sm">
                        {item.qtyPicked || 0} / {item.qtyToPick}
                    </span>
                    <span className="mt-1 text-[9px] font-black uppercase tracking-tighter text-muted-foreground">{item.baseUnit}</span>
                </div>
            </TableCell>
            <TableCell className="text-center text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                {item.status === "PENDING" ? "Cần lấy" : "Đã lấy"}
            </TableCell>
            <TableCell className="text-right pr-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 rounded-lg text-primary shadow-sm ring-1 ring-border"
                    onClick={(event) => {
                        event.stopPropagation();
                        onDispatch({ selectedId: item.id });
                    }}
                >
                    <Eye className="size-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

function PickingDetailDialog({
    detailItem,
    isDetailLoading,
    open,
    onOpenChange,
}: {
    detailItem?: PickingItem;
    isDetailLoading: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] overflow-hidden rounded-lg p-0 shadow-2xl sm:max-w-2xl">
                <DialogHeader className="border-b border-border bg-muted/45 p-5">
                    <DialogTitle className="flex min-w-0 items-center gap-3 text-lg font-black text-foreground">
                        <div className="ui-icon-tile size-9 bg-primary text-primary-foreground">
                            <Package2 className="size-5" />
                        </div>
                        <span className="truncate">{detailItem?.salesOrderNumber || "Chi tiết Picking"}</span>
                    </DialogTitle>
                </DialogHeader>
                {isDetailLoading ? (
                    <PickingDetailLoading />
                ) : detailItem ? (
                    <PickingDetailContent detailItem={detailItem} />
                ) : (
                    <PickingDetailEmpty />
                )}
            </DialogContent>
        </Dialog>
    );
}

function PickingDetailLoading() {
    return (
        <div className="py-20 text-center">
            <div className="mx-auto size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Đang truy xuất dữ liệu…</p>
        </div>
    );
}

function PickingDetailContent({ detailItem }: { detailItem: PickingItem }) {
    return (
        <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="ui-muted-surface p-4">
                    <p className="ui-label mb-1">Thứ tự lấy hàng</p>
                    <p className="text-sm font-black text-primary">SEQ-{detailItem.pickSequence || 1}</p>
                </div>
                <div className="flex sm:justify-end">
                    <StatusBadge tone={detailItem.status === "PICKED" ? "success" : (detailItem.qtyPicked || 0) > 0 ? "warning" : "info"}>
                        {detailItem.status === "PICKED" ? "Hoàn tất" : (detailItem.qtyPicked || 0) > 0 ? "Đang lấy" : "Chờ lấy"}
                    </StatusBadge>
                </div>
            </div>
            <PickingDetailProduct detailItem={detailItem} />
            <PickingDetailLocation detailItem={detailItem} />
            <PickingDetailStats detailItem={detailItem} />
        </div>
    );
}

function PickingDetailProduct({ detailItem }: { detailItem: PickingItem }) {
    return (
        <div className="ui-surface p-4">
            <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="ui-label">SKU / Mã sản phẩm</p>
                        <p className="truncate text-base font-black uppercase text-foreground">{detailItem.productSku}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="ui-label">Tên sản phẩm</p>
                        <p className="text-sm font-bold leading-relaxed text-muted-foreground">{detailItem.productName || "—"}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="ui-label">Danh mục</p>
                        <p className="truncate text-xs font-bold text-muted-foreground">{detailItem.categoryName || "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="ui-label">Mã vạch</p>
                        <p className="truncate font-mono text-xs font-bold text-muted-foreground">{detailItem.barcodeEan13 || "—"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PickingDetailLocation({ detailItem }: { detailItem: PickingItem }) {
    return (
        <div className="ui-surface p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <div className="ui-icon-tile size-12 text-primary">
                        <MapPin className="size-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="ui-label mb-1">Vị trí lưu kho</p>
                        <p className="truncate text-2xl font-black uppercase leading-none tabular-nums text-foreground">{displayPickingLocation(detailItem)}</p>
                    </div>
                </div>
                {detailItem.zone || detailItem.aisle ? (
                    <div className="flex flex-wrap gap-2">
                        {detailItem.zone ? <span className="rounded bg-info-soft px-2 py-1 text-[10px] font-black uppercase text-info-foreground">Khu vực {detailItem.zone}</span> : null}
                        {detailItem.aisle ? <span className="rounded bg-info-soft px-2 py-1 text-[10px] font-black uppercase text-info-foreground">Dãy {detailItem.aisle}</span> : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function PickingDetailStats({ detailItem }: { detailItem: PickingItem }) {
    const stats = [
        ["Số lượng đặt", detailItem.qtyToPick],
        ["Đã lấy", detailItem.qtyPicked || 0],
        ["Hiện có", detailItem.qtyAvailable ?? "0"],
    ] as const;

    return (
        <div className="grid gap-3 sm:grid-cols-3">
            {stats.map(([label, value]) => (
                <div key={label} className="ui-muted-surface p-4 text-center">
                    <span className="ui-label">{label}</span>
                    <div className="mt-2 flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-black tabular-nums text-foreground">{value}</span>
                        <span className="text-[10px] font-black uppercase text-muted-foreground">{detailItem.baseUnit || "Đv"}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PickingDetailEmpty() {
    return (
        <div className="py-20 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-danger-soft text-destructive">
                <Archive className="size-7" />
            </div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-destructive">Dữ liệu không phản hồi</h4>
            <p className="mt-2 text-xs text-muted-foreground">Kiểm tra kết nối hoặc thử lại sau.</p>
        </div>
    );
}
