"use client";

import React, { useMemo, useState } from "react";
// removed card imports
import { type PickingItem } from "@/types/picking-item";
import { Archive, Eye, MapPin, ChevronDown, ChevronRight, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { AdvancedFilterActions } from "@/components/features/AdvancedFilters";
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
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 flex flex-col">
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
                        <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
                            <TableRow>
                                <TableHead className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"></TableHead>
                                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Chi tiết Pick</TableHead>
                                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Vị trí kho</TableHead>
                                <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tiến độ</TableHead>
                                <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Trạng thái</TableHead>
                                <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pr-6 w-[120px]">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-500">
                                        <div className="flex flex-col items-center gap-2 animate-pulse">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                            <span className="font-semibold text-xs uppercase tracking-widest">Đang tải dữ liệu...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : groupedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Package2 className="h-10 w-10 opacity-20" />
                                            <span className="text-sm font-medium">Không tìm thấy dữ liệu picking</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : groupedData.map((group) => (
                                <React.Fragment key={group.soNumber}>
                                    <TableRow
                                        className="group cursor-pointer bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/20 dark:hover:bg-slate-800/40"
                                        onClick={() => toggleGroup(group.soNumber)}
                                    >
                                        <TableCell className="pl-4">
                                            {expandedGroups[group.soNumber] === true ? <ChevronDown className="h-4 w-4 text-indigo-500" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                        </TableCell>
                                        <TableCell colSpan={2} className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-400 uppercase leading-none mb-1">Đơn hàng</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                                                            {group.soNumber}
                                                        </span>
                                                        <Badge variant="outline" className="text-[9px] h-4 px-1 font-bold bg-slate-100/50 text-slate-500 border-slate-200">
                                                            {group.items.length} SKU
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black tabular-nums">{group.totalPicked}/{group.totalToPick}</span>
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                        group.progress === 100 ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700 font-black"
                                                    )}>
                                                        {Math.round(group.progress)}%
                                                    </span>
                                                </div>
                                                <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className={cn("h-full transition-all duration-700", group.progress === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                                                        style={{ width: `${group.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                className={cn(
                                                    "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm border-none",
                                                    group.status === "PICKED"
                                                        ? "bg-emerald-600 text-white"
                                                        : group.status === "PARTIAL"
                                                            ? "bg-amber-400 text-white"
                                                            : "bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                )}
                                            >
                                                {group.status === "PICKED" ? "Hoàn tất" : group.status === "PARTIAL" ? "Đang lấy" : "Chờ lấy"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 flex justify-end gap-2 items-center">
                                            {group.status === "PENDING" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[11px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
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
                                            className="group/row transition-all animate-in fade-in slide-in-from-left-2 duration-300 odd:bg-white even:bg-slate-50/20 hover:bg-indigo-50/30 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20"
                                        >
                                            <TableCell className="pl-6"></TableCell>
                                            <TableCell className="py-4 pl-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[13px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{item.productSku}</span>
                                                    </div>
                                                    <span className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1 max-w-[250px]">{item.productName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-mono text-xs font-black ring-1 ring-inset ring-indigo-200/40">
                                                        <MapPin className="h-3 w-3" />
                                                        {item.locationCode}
                                                    </div>
                                                    {item.zone && <span className="text-[10px] font-bold text-slate-400 mt-1 pl-1 capitalize">{item.zone} - {item.aisle}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-bold tabular-nums text-slate-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full ring-1 ring-slate-200 shadow-sm">
                                                        {item.qtyPicked || 0} / {item.qtyToPick}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">{item.baseUnit}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                                {item.status === "PENDING" ? "Cần lấy" : "Đã lấy"}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-white shadow-sm ring-1 ring-indigo-100"
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
                <DialogContent className="sm:max-w-140 rounded-xl border-none shadow-2xl overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-black text-indigo-600 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Package2 className="h-5 w-5 text-white" />
                            </div>
                            {detailItem?.salesOrderNumber || "Chi tiết Picking"}
                        </DialogTitle>
                    </DialogHeader>
                    {isDetailLoading ? (
                        <div className="py-20 text-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
                            <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Đang truy xuất dữ liệu...</p>
                        </div>
                    ) : detailItem ? (
                        <div className="p-6">
                            <div className="overflow-hidden bg-white dark:bg-slate-900">
                                {/* Header: Sequence & Status */}
                                <div className="px-0 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Pick sequence</span>
                                        <span className="text-sm font-black text-indigo-600">SEQ-{detailItem.pickSequence || 1}</span>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-none",
                                            detailItem.status === "PICKED"
                                                ? "bg-emerald-500 text-white"
                                                : (detailItem.qtyPicked || 0) > 0
                                                    ? "bg-amber-400 text-white"
                                                    : "bg-indigo-600 text-white"
                                        )}
                                    >
                                        {detailItem.status === "PICKED" ? "Hoàn tất" : (detailItem.qtyPicked || 0) > 0 ? "Đang lấy" : "Chờ lấy"}
                                    </Badge>
                                </div>

                                {/* Body Content */}
                                <div className="py-8 space-y-10">
                                    {/* Product Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SKU / Mã sản phẩm</p>
                                                <p className="text-base font-black text-slate-900 dark:text-white uppercase">{detailItem.productSku}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tên sản phẩm</p>
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{detailItem.productName || "—"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Danh mục</p>
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{detailItem.categoryName || "—"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mã vạch</p>
                                                <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{detailItem.barcodeEan13 || "—"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Section */}
                                    <div className="flex items-center justify-between border-t border-b border-slate-100 dark:border-slate-800 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600">
                                                <MapPin className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Vị trí lưu kho</p>
                                                <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white uppercase leading-none">{detailItem.locationCode || "—"}</p>
                                            </div>
                                        </div>
                                        { (detailItem.zone || detailItem.aisle) && (
                                            <div className="flex gap-2">
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded">Khu vực {detailItem.zone}</span>
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded">Dãy {detailItem.aisle}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Inventory & Progress Section - Minimalist Grid */}
                                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Số lượng đặt</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{detailItem.qtyToPick}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{detailItem.baseUnit || "Đv"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Đã lấy</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{detailItem.qtyPicked || 0}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{detailItem.baseUnit || "Đv"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Hiện có</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{detailItem.qtyAvailable ?? "0"}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{detailItem.baseUnit || "Đv"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4">
                                <Archive className="h-7 w-7" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-rose-600">Dữ liệu không phản hồi</h4>
                            <p className="mt-2 text-xs text-slate-400">Kiểm tra kết nối hoặc thử lại sau.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

