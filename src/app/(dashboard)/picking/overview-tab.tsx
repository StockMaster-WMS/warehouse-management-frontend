"use client";

import React, { Dispatch, useEffect, useMemo, useReducer } from "react";
// removed card imports
import { type PickingItem } from "@/types/picking-item";
import { Archive, Eye, MapPin, ChevronDown, ChevronRight, Package2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { OperationDatePresetSelect } from "@/components/ui/operation-date-preset-select";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { useHasPermissions } from "@/components/permission-control";
import { PICKING_ASSIGN_ROLES } from "@/lib/access-control";
import {
    DEFAULT_OPERATION_DATE_PRESET,
    getOperationDateRange,
    type OperationDatePreset,
} from "@/lib/date-range";
import { statusTone } from "@/lib/design-system";
import { apiErrMessage } from "@/types/api";
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    useAssignPickingTaskMutation,
    useGetPickingItemByIdQuery,
    useGetPickingItemsQuery,
} from "@/store/services/picking-item.service";
import { useGetWarehouseStaffQuery } from "@/store/services/user-management.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import type { ManagedUser } from "@/types/user-management";
import type { Warehouse } from "@/types/warehouse";

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
    assignGroup: GroupedPicking | null;
    assignAssigneeId: string;
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
    assignGroup: null,
    assignAssigneeId: "",
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

function userDisplayName(user: ManagedUser) {
    const primary = user.name?.trim() || user.username || user.email || user.id;
    const email = user.email?.trim();
    const name = email && email !== primary ? `${primary} (${email})` : primary;
    const warehouses = user.warehouseNames?.length ? ` - ${user.warehouseNames.join(", ")}` : "";
    return `${name}${warehouses}`;
}

function userShortDisplayName(user: ManagedUser) {
    return user.name?.trim() || user.fullName?.trim() || user.username || user.email || user.id;
}

function getGroupWarehouseId(group: GroupedPicking | null) {
    return group?.items.find((item) => item.warehouseId)?.warehouseId ?? "";
}

function warehouseDisplayName(warehouse?: Warehouse, fallbackId?: string) {
    if (warehouse) {
        return `${warehouse.name}${warehouse.code ? ` (${warehouse.code})` : ""}`;
    }
    return fallbackId || "Kho chưa xác định";
}

function assigneeDisplayName(assigneeId: string | null | undefined, assigneeNameById: Map<string, string>) {
    if (!assigneeId) {
        return "";
    }
    return assigneeNameById.get(assigneeId) ?? assigneeId;
}

function groupAssigneeSummary(group: GroupedPicking, assigneeNameById: Map<string, string>) {
    const assigneeIds = Array.from(new Set(group.items.map((item) => item.assigneeId).filter(Boolean) as string[]));
    if (assigneeIds.length === 0) {
        return "Chưa giao nhân viên";
    }
    if (assigneeIds.length === 1) {
        return `Giao cho: ${assigneeDisplayName(assigneeIds[0], assigneeNameById)}`;
    }
    return `Giao cho ${assigneeIds.length} nhân viên`;
}

export function OverviewTab({ initialSelectedId }: { initialSelectedId?: string | null }) {
    const [state, dispatch] = useReducer(overviewReducer, INITIAL_OVERVIEW_STATE);
    const { searchTerm, selectedId, expandedGroups, advancedOpen, page, pageSize, status, datePreset, assignGroup, assignAssigneeId } = state;
    const dateRange = useMemo(() => getOperationDateRange(datePreset), [datePreset]);
    const [assignTask, { isLoading: isAssigning }] = useAssignPickingTaskMutation();
    const canAssignPicking = useHasPermissions(PICKING_ASSIGN_ROLES);
    const assignWarehouseId = useMemo(() => getGroupWarehouseId(assignGroup), [assignGroup]);
    const { data: warehousesData } = useGetWarehousesQuery({
        page: 0,
        size: 200,
        sort: "name",
        sortDir: "asc",
        isActive: true,
    });
    const { data: staffData, isLoading: isStaffLoading, isError: isStaffError } = useGetWarehouseStaffQuery({ warehouseId: assignWarehouseId }, {
        skip: !canAssignPicking || !assignGroup || !assignWarehouseId,
    });
    const { data: allStaffData } = useGetWarehouseStaffQuery(undefined, {
        skip: !canAssignPicking,
    });

    const staffUsers = useMemo(() => staffData?.data ?? [], [staffData]);
    const assigneeNameById = useMemo(
        () => new Map((allStaffData?.data ?? []).map((user) => [user.id, userShortDisplayName(user)])),
        [allStaffData],
    );
    const warehouseById = useMemo(
        () => new Map((warehousesData?.data?.content ?? []).map((warehouse) => [warehouse.id, warehouse])),
        [warehousesData],
    );
    const selectedAssignAssignee = useMemo(
        () => staffUsers.find((user) => user.id === assignAssigneeId),
        [assignAssigneeId, staffUsers],
    );

    useEffect(() => {
        if (initialSelectedId) {
            dispatch({ selectedId: initialSelectedId });
        }
    }, [initialSelectedId]);

    const { data, isLoading, isFetching, isError, refetch } = useGetPickingItemsQuery({
        page,
        size: pageSize,
        status: status === "all" ? undefined : status,
        salesOrderStatus: "PICKING",
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

    const openAssignDialog = (event: React.MouseEvent, group: GroupedPicking) => {
        event.stopPropagation();

        if (!canAssignPicking) {
            toast.error("Bạn không có quyền thực hiện thao tác này.");
            return;
        }

        dispatch({ assignGroup: group, assignAssigneeId: "" });
    };

    const closeAssignDialog = () => {
        dispatch({ assignGroup: null, assignAssigneeId: "" });
    };

    const handleAssignGroup = async () => {
        if (!assignGroup) {
            return;
        }

        if (!assignWarehouseId) {
            toast.error("Không xác định được kho của đơn xuất này. Vui lòng tải lại danh sách lấy hàng.");
            return;
        }

        if (!assignAssigneeId) {
            toast.error("Vui lòng chọn nhân viên nhận nhiệm vụ trước khi phân công.");
            return;
        }

        const assignee = staffUsers.find((user) => user.id === assignAssigneeId);
        if (!assignee) {
            toast.error("Không tìm thấy nhân viên nhận nhiệm vụ. Vui lòng tải lại danh sách nhân viên.");
            return;
        }

        const itemsToAssign = assignGroup.items.filter((item) => item.assigneeId !== assignAssigneeId);
        if (itemsToAssign.length === 0) {
            toast.info("Các nhiệm vụ này đã được phân công cho nhân viên đã chọn.");
            return;
        }

        try {
            await Promise.all(
                itemsToAssign.map((item) =>
                    assignTask({
                        id: item.id,
                        soItemId: item.soItemId,
                        assigneeId: assignAssigneeId,
                    }).unwrap(),
                ),
            );
            toast.success(`Đã giao nhiệm vụ cho ${userDisplayName(assignee)}.`);
            closeAssignDialog();
        } catch (err) {
            toast.error(apiErrMessage(err, "Không thể phân công. Kiểm tra nhân viên nhận nhiệm vụ còn hoạt động."));
        }
    };

    const detailItem = detailData?.data;
    const totalElements = data?.data?.total_elements ?? 0;
    const totalPages = data?.data?.total_pages ?? 0;
    const rowsCount = data?.data?.content?.length ?? 0;
    const hasAnyFilter = Boolean(searchTerm.trim() || status !== "all" || datePreset !== DEFAULT_OPERATION_DATE_PRESET);
    const activeFilterCount =
        (status !== "all" ? 1 : 0);

    return (
        <div className="space-y-6">
            <div className="ui-surface flex flex-col overflow-hidden transition-all duration-300">
                <SearchToolbar
                    noContainer
                    placeholder="Tìm theo đơn hàng, mã hàng, vị trí..."
                    value={searchTerm}
                    onValueChange={(searchTerm) => dispatch({ searchTerm, page: 0 })}
                    right={
                        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end">
                            <OperationDatePresetSelect
                                value={datePreset}
                                onValueChange={(datePreset) => dispatch({ datePreset, page: 0 })}
                            />
                            <TableRefreshButton isFetching={isFetching} onRefresh={() => refetch()} />
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
                        </div>
                    }
                />
                <PickingAdvancedFilters
                    open={advancedOpen}
                    status={status}
                    onStatusChange={(status) => dispatch({ status, page: 0 })}
                />

                <PickingOverviewTable
                    expandedGroups={expandedGroups}
                    groupedData={groupedData}
                    canAssignPicking={canAssignPicking}
                    isAssigning={isAssigning}
                    isLoading={isLoading}
                    onAssignGroup={openAssignDialog}
                    onDispatch={dispatch}
                    onToggleGroup={toggleGroup}
                    warehouseById={warehouseById}
                    assigneeNameById={assigneeNameById}
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
            <AssignStaffDialog
                group={assignGroup}
                isAssigning={isAssigning}
                isStaffError={isStaffError}
                isStaffLoading={isStaffLoading}
                selectedAssignee={selectedAssignAssignee}
                selectedAssigneeId={assignAssigneeId}
                staffUsers={staffUsers}
                warehouseId={assignWarehouseId}
                open={!!assignGroup}
                onAssign={handleAssignGroup}
                onOpenChange={(open) => {
                    if (!open) closeAssignDialog();
                }}
                onSelectAssignee={(assignAssigneeId) => dispatch({ assignAssigneeId })}
            />
        </div>
    );
}

function PickingAdvancedFilters({
    open,
    status,
    onStatusChange,
}: {
    open: boolean;
    status: OverviewState["status"];
    onStatusChange: (status: OverviewState["status"]) => void;
}) {
    const statusLabel: Record<OverviewState["status"], string> = {
        all: "Tất cả trạng thái",
        PENDING: "Chờ lấy",
        PICKED: "Đã lấy",
    };

    return (
        <AdvancedFilterPanel open={open}>
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

function AssignStaffDialog({
    group,
    isAssigning,
    isStaffError,
    isStaffLoading,
    selectedAssignee,
    selectedAssigneeId,
    staffUsers,
    warehouseId,
    open,
    onAssign,
    onOpenChange,
    onSelectAssignee,
}: {
    group: GroupedPicking | null;
    isAssigning: boolean;
    isStaffError: boolean;
    isStaffLoading: boolean;
    selectedAssignee?: ManagedUser;
    selectedAssigneeId: string;
    staffUsers: ManagedUser[];
    warehouseId: string;
    open: boolean;
    onAssign: () => void;
    onOpenChange: (open: boolean) => void;
    onSelectAssignee: (assigneeId: string) => void;
}) {
    const assignableCount = group?.items.filter((item) => item.assigneeId !== selectedAssigneeId).length ?? 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl p-4">
                <DialogHeader className="px-5 pt-5">
                    <DialogTitle>Chọn nhân viên lấy hàng</DialogTitle>
                    <DialogDescription>
                        {group
                            ? `Đơn ${group.soNumber} có ${group.items.length} dòng lấy hàng cần điều phối.`
                            : "Chọn nhân viên để phân công nhiệm vụ lấy hàng."}
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[56vh] overflow-auto px-5">
                    <Table>
                        <TableHeader className="ui-table-header">
                            <TableRow>
                                <TableHead className="ui-label p-3">Nhân viên</TableHead>
                                <TableHead className="ui-label p-3">Kho phụ trách</TableHead>
                                <TableHead className="ui-label w-[120px] p-3 text-right">Chọn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!warehouseId ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-10 text-center text-sm font-medium text-rose-500">
                                        Không xác định được kho của đơn xuất này.
                                    </TableCell>
                                </TableRow>
                            ) : isStaffLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        Đang tải nhân viên...
                                    </TableCell>
                                </TableRow>
                            ) : isStaffError ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-10 text-center text-sm font-medium text-rose-500">
                                        Không tải được danh sách nhân viên.
                                    </TableCell>
                                </TableRow>
                            ) : staffUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-10 text-center text-sm font-medium text-muted-foreground">
                                        Chưa có nhân viên kho được phân quyền vào kho của đơn xuất này.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staffUsers.map((user) => {
                                    const selected = user.id === selectedAssigneeId;
                                    const email = user.email?.trim();
                                    const name = user.name?.trim() || user.fullName?.trim() || user.username || user.id;
                                    const warehouses = user.warehouseNames?.length ? user.warehouseNames.join(", ") : "Chưa gắn kho";

                                    return (
                                        <TableRow
                                            key={user.id}
                                            className={cn("ui-table-row cursor-pointer", selected && "bg-primary/5")}
                                            onClick={() => onSelectAssignee(user.id)}
                                        >
                                            <TableCell className="p-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{email || user.username}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[260px] p-3">
                                                <span className="line-clamp-2 text-sm text-muted-foreground">{warehouses}</span>
                                            </TableCell>
                                            <TableCell className="p-3 text-right">
                                                <Button
                                                    type="button"
                                                    variant={selected ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-8 rounded-lg"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        onSelectAssignee(user.id);
                                                    }}
                                                >
                                                    {selected ? "Đã chọn" : "Chọn"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="items-center gap-2">
                    <div className="mr-auto min-w-0 text-xs text-muted-foreground">
                        {selectedAssignee
                            ? `${assignableCount} nhiệm vụ sẽ giao cho ${userDisplayName(selectedAssignee)}.`
                            : "Chọn một nhân viên trong bảng để phân công."}
                    </div>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        disabled={!warehouseId || !selectedAssigneeId || isAssigning || isStaffLoading || isStaffError}
                        onClick={onAssign}
                    >
                        {isAssigning ? "Đang giao..." : "Giao nhân viên"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PickingOverviewTable({
    expandedGroups,
    groupedData,
    canAssignPicking,
    isAssigning,
    isLoading,
    onAssignGroup,
    onDispatch,
    onToggleGroup,
    warehouseById,
    assigneeNameById,
}: {
    expandedGroups: Record<string, boolean>;
    groupedData: GroupedPicking[];
    canAssignPicking: boolean;
    isAssigning: boolean;
    isLoading: boolean;
    onAssignGroup: (event: React.MouseEvent, group: GroupedPicking) => void;
    onDispatch: Dispatch<Partial<OverviewState>>;
    onToggleGroup: (so: string) => void;
    warehouseById: Map<string, Warehouse>;
    assigneeNameById: Map<string, string>;
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
                                canAssignPicking={canAssignPicking}
                                isAssigning={isAssigning}
                                onAssignGroup={onAssignGroup}
                                onDispatch={onDispatch}
                                onToggleGroup={onToggleGroup}
                                warehouseById={warehouseById}
                                assigneeNameById={assigneeNameById}
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
                    title="Không tìm thấy dữ liệu lấy hàng"
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
    canAssignPicking,
    isAssigning,
    onAssignGroup,
    onDispatch,
    onToggleGroup,
    warehouseById,
    assigneeNameById,
}: {
    expanded: boolean;
    group: GroupedPicking;
    canAssignPicking: boolean;
    isAssigning: boolean;
    onAssignGroup: (event: React.MouseEvent, group: GroupedPicking) => void;
    onDispatch: Dispatch<Partial<OverviewState>>;
    onToggleGroup: (so: string) => void;
    warehouseById: Map<string, Warehouse>;
    assigneeNameById: Map<string, string>;
}) {
    const warehouseId = getGroupWarehouseId(group);
    const warehouseLabel = warehouseDisplayName(warehouseById.get(warehouseId), warehouseId);
    const assigneeSummary = groupAssigneeSummary(group, assigneeNameById);

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
                                {group.items.length} mã hàng
                            </StatusBadge>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <MapPin className="size-3" />
                            <span className="truncate">Kho: {warehouseLabel}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Users className="size-3" />
                            <span className="truncate">{assigneeSummary}</span>
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
                    {canAssignPicking ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isAssigning || group.items.every((item) => item.assigneeId)}
                            onClick={(event) => onAssignGroup(event, group)}
                            className="h-8 gap-1.5 rounded-lg"
                        >
                            <Users className="size-3.5" />
                            Giao nhân viên
                        </Button>
                    ) : null}
                </TableCell>
            </TableRow>

            {expanded
                ? group.items.map((item) => (
                    <PickingItemRow key={item.id} item={item} assigneeNameById={assigneeNameById} onDispatch={onDispatch} />
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
    assigneeNameById,
    onDispatch,
}: {
    item: PickingItem;
    assigneeNameById: Map<string, string>;
    onDispatch: Dispatch<Partial<OverviewState>>;
}) {
    const assigneeName = assigneeDisplayName(item.assigneeId, assigneeNameById);

    return (
        <TableRow className="ui-table-row group/row animate-in fade-in slide-in-from-left-2 duration-300">
            <TableCell className="pl-6"></TableCell>
            <TableCell className="py-4 pl-4">
                <div className="flex flex-col">
                    <span className="text-[13px] font-black uppercase tracking-tight text-foreground">{item.productSku}</span>
                    <span className="mt-0.5 line-clamp-1 max-w-[250px] text-[11px] font-medium text-muted-foreground">{item.productName}</span>
                    <span className={cn("mt-1 inline-flex items-center gap-1 text-[11px] font-semibold", assigneeName ? "text-primary" : "text-muted-foreground")}>
                        <Users className="size-3" />
                        {assigneeName ? `Giao cho: ${assigneeName}` : "Chưa giao nhân viên"}
                    </span>
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
                        <span className="truncate">{detailItem?.salesOrderNumber || "Chi tiết lấy hàng"}</span>
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
                        <p className="ui-label">Mã hàng / mã sản phẩm</p>
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
