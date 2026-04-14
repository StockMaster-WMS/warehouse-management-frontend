"use client";

import React, { useMemo, useState } from "react";
// removed card imports
import { type PickingItem } from "@/types/picking-item";
import { Archive, Eye, MapPin, ChevronDown, ChevronRight, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdvancedFilterActions } from "@/components/features/AdvancedFilters";
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

import { toast } from "sonner";
import { useGetPickingItemsQuery, useGetPickingItemByIdQuery, useAssignPickingTaskMutation } from "@/store/services/picking-item.service";

interface GroupedPicking {
    soNumber: string;
    items: PickingItem[];
    progress: number;
    totalToPick: number;
    totalPicked: number;
    status: "PENDING" | "PARTIAL" | "PICKED";
}

export function OverviewTab() {
    const [filter] = useState<string>("pending");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const { data, isLoading } = useGetPickingItemsQuery({
        status: filter === "all" ? undefined : filter.toUpperCase()
    });

    const { data: detailData, isFetching: isDetailLoading } = useGetPickingItemByIdQuery(
        selectedId as string,
        { skip: !selectedId }
    );
    const [assignTask] = useAssignPickingTaskMutation();

    const handleAssignGroup = async (e: React.MouseEvent, group: GroupedPicking) => {
        e.stopPropagation();
        try {
            await Promise.all(group.items.map(i => assignTask({ id: i.id, soItemId: i.soItemId, assigneeId: "user-demotask" }).unwrap()));
            toast.success(`Đã giao ${group.items.length} tác vụ thành công!`);
        } catch {
            toast.error("Lỗi khi phân công tác vụ!");
        }
    };

    const { groupedData } = useMemo(() => {
        const rawItems = data?.data?.content || [];

        // 1. Calculate Global Stats
        const pendingCount = rawItems.filter(i => i.status === "PENDING").length;
        const pickedCount = rawItems.filter(i => i.status === "PICKED").length;
        const uniqueSOsCount = new Set(rawItems.map(i => i.salesOrderNumber || i.soItemId)).size;

        // 2. Filter by search
        let filtered = [...rawItems];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.salesOrderNumber?.toLowerCase().includes(s) ||
                item.productSku?.toLowerCase().includes(s) ||
                item.productName?.toLowerCase().includes(s) ||
                item.locationCode?.toLowerCase().includes(s) ||
                item.id.toLowerCase().includes(s)
            );
        }

        // 3. Group and Consolidate
        const groups: Record<string, GroupedPicking> = {};

        filtered.forEach(item => {
            const soKey = item.salesOrderNumber || item.soItemId || "Unknown SO";
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
        setExpandedGroups(prev => ({ ...prev, [so]: !prev[so] }));
    };

    const detailItem = detailData?.data;

    return (
        <div className="space-y-6">
            <div className="ui-surface flex flex-col overflow-hidden transition-all duration-300">
                <SearchToolbar
                    noContainer
                    placeholder="Tìm theo đơn hàng, SKU, vị trí..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    right={
                        <AdvancedFilterActions
                            open={advancedOpen}
                            onToggle={() => setAdvancedOpen(!advancedOpen)}
                            activeCount={0}
                            hasAnyFilter={false}
                            onClear={() => setSearchTerm("")}
                        />
                    }
                />

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="ui-table-header">
                            <TableRow>
                                <TableHead className="ui-label w-12 px-3 py-3 text-center"></TableHead>
                                <TableHead className="ui-label px-3 py-3">Chi tiết Pick</TableHead>
                                <TableHead className="ui-label px-3 py-3">Vị trí kho</TableHead>
                                <TableHead className="ui-label px-3 py-3 text-center">Tiến độ</TableHead>
                                <TableHead className="ui-label px-3 py-3 text-center">Trạng thái</TableHead>
                                <TableHead className="ui-label w-[120px] px-3 py-3 pr-6 text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2 animate-pulse">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            <span className="font-semibold text-xs uppercase tracking-widest">Đang tải dữ liệu...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : groupedData.length === 0 ? (
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
                            ) : groupedData.map((group) => (
                                <React.Fragment key={group.soNumber}>
                                    <TableRow
                                        className="ui-table-row group cursor-pointer"
                                        onClick={() => toggleGroup(group.soNumber)}
                                    >
                                        <TableCell className="pl-4">
                                            {expandedGroups[group.soNumber] === true ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                        </TableCell>
                                        <TableCell colSpan={2} className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="ui-label mb-1 leading-none">Đơn hàng</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black tabular-nums tracking-tight text-foreground">
                                                            {group.soNumber}
                                                        </span>
                                                        <StatusBadge dot={false} tone="neutral" className="h-4 px-1 text-[9px]">
                                                            {group.items.length} SKU
                                                        </StatusBadge>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black tabular-nums text-foreground">{group.totalPicked}/{group.totalToPick}</span>
                                                    <span className={cn(
                                                        "rounded px-1.5 py-0.5 text-[10px] font-bold",
                                                        group.progress === 100 ? "bg-success-soft text-success-foreground" : "bg-info-soft text-info-foreground font-black"
                                                    )}>
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
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge tone={statusTone(group.status)}>
                                                {group.status === "PICKED" ? "Hoàn tất" : group.status === "PARTIAL" ? "Đang lấy" : "Chờ lấy"}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 flex justify-end gap-2 items-center">
                                            {group.status === "PENDING" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[11px] font-bold"
                                                    onClick={(e) => handleAssignGroup(e, group)}
                                                >
                                                    Giao nhân viên
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>

                                    {expandedGroups[group.soNumber] === true && group.items.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className="ui-table-row group/row animate-in fade-in slide-in-from-left-2 duration-300"
                                        >
                                            <TableCell className="pl-6"></TableCell>
                                            <TableCell className="py-4 pl-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[13px] font-black uppercase tracking-tight text-foreground">{item.productSku}</span>
                                                    </div>
                                                    <span className="mt-0.5 line-clamp-1 max-w-[250px] text-[11px] font-medium text-muted-foreground">{item.productName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="inline-flex items-center gap-1.5 rounded bg-info-soft px-2 py-1 font-mono text-xs font-black text-info-foreground ring-1 ring-inset ring-info/20">
                                                        <MapPin className="h-3 w-3" />
                                                        {item.locationCode}
                                                    </div>
                                                    {item.zone && <span className="mt-1 pl-1 text-[10px] font-bold capitalize text-muted-foreground">{item.zone} - {item.aisle}</span>}
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
                                                    className="h-8 w-8 rounded-lg text-primary shadow-sm ring-1 ring-border"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedId(item.id);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
                <DialogContent className="overflow-hidden rounded-lg p-0 shadow-2xl sm:max-w-140">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-primary">
                            <div className="ui-icon-tile h-8 w-8 bg-primary text-primary-foreground">
                                <Package2 className="h-5 w-5" />
                            </div>
                            {detailItem?.salesOrderNumber || "Chi tiết Picking"}
                        </DialogTitle>
                    </DialogHeader>
                    {isDetailLoading ? (
                        <div className="py-20 text-center">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Đang truy xuất dữ liệu...</p>
                        </div>
                    ) : detailItem ? (
                        <div className="p-6">
                            <div className="overflow-hidden bg-card">
                                <div className="flex items-center justify-between border-b border-border px-0 py-4">
                                    <div className="flex flex-col">
                                        <span className="ui-label mb-0.5">Pick sequence</span>
                                        <span className="text-sm font-black text-primary">SEQ-{detailItem.pickSequence || 1}</span>
                                    </div>
                                    <StatusBadge tone={detailItem.status === "PICKED" ? "success" : (detailItem.qtyPicked || 0) > 0 ? "warning" : "info"}>
                                        {detailItem.status === "PICKED" ? "Hoàn tất" : (detailItem.qtyPicked || 0) > 0 ? "Đang lấy" : "Chờ lấy"}
                                    </StatusBadge>
                                </div>

                                <div className="py-8 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="ui-label">SKU / Mã sản phẩm</p>
                                                <p className="text-base font-black uppercase text-foreground">{detailItem.productSku}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="ui-label">Tên sản phẩm</p>
                                                <p className="text-sm font-bold leading-relaxed text-muted-foreground">{detailItem.productName || "—"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="ui-label">Danh mục</p>
                                                <p className="text-xs font-bold text-muted-foreground">{detailItem.categoryName || "—"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="ui-label">Mã vạch</p>
                                                <p className="font-mono text-xs font-bold text-muted-foreground">{detailItem.barcodeEan13 || "—"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-y border-border py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="ui-icon-tile h-12 w-12 text-primary">
                                                <MapPin className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="ui-label mb-0.5">Vị trí lưu kho</p>
                                                <p className="text-2xl font-black uppercase leading-none tabular-nums text-foreground">{detailItem.locationCode || "—"}</p>
                                            </div>
                                        </div>
                                        { (detailItem.zone || detailItem.aisle) && (
                                            <div className="flex gap-2">
                                                <span className="rounded bg-info-soft px-2 py-1 text-[10px] font-black uppercase text-info-foreground">Khu vực {detailItem.zone}</span>
                                                <span className="rounded bg-info-soft px-2 py-1 text-[10px] font-black uppercase text-info-foreground">Dãy {detailItem.aisle}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <span className="mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Số lượng đặt</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black tabular-nums text-foreground">{detailItem.qtyToPick}</span>
                                            <span className="text-[10px] font-black uppercase text-muted-foreground">{detailItem.baseUnit || "Đv"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <span className="mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Đã lấy</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black tabular-nums text-foreground">{detailItem.qtyPicked || 0}</span>
                                            <span className="text-[10px] font-black uppercase text-muted-foreground">{detailItem.baseUnit || "Đv"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <span className="mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Hiện có</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black tabular-nums text-foreground">{detailItem.qtyAvailable ?? "0"}</span>
                                            <span className="text-[10px] font-black uppercase text-muted-foreground">{detailItem.baseUnit || "Đv"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-destructive">
                                <Archive className="h-7 w-7" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-destructive">Dữ liệu không phản hồi</h4>
                            <p className="mt-2 text-xs text-muted-foreground">Kiểm tra kết nối hoặc thử lại sau.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
