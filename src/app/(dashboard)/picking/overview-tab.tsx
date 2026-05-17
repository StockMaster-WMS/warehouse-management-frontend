"use client";

import React, { useMemo, useState } from "react";
import { Archive, Eye, MapPin, ChevronDown, ChevronRight, Package2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useGetPickingItemsQuery, useGetPickingItemByIdQuery, useAssignPickingTaskMutation } from "@/store/services/picking-item.service";
import type { PickingItem } from "@/types/picking-item";

interface GroupedPicking {
    soNumber: string;
    items: PickingItem[];
    progress: number;
    totalToPick: number;
    totalPicked: number;
    status: "PENDING" | "PARTIAL" | "PICKED";
}

const STATUS_CONFIG = {
    PICKED: { label: "Hoàn tất", className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" },
    PARTIAL: { label: "Đang lấy", className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300" },
    PENDING: { label: "Chờ lấy", className: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400" },
} as const;

export function OverviewTab() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const { data, isLoading } = useGetPickingItemsQuery({ status: "PENDING" });
    const { data: detailData, isFetching: isDetailLoading } = useGetPickingItemByIdQuery(
        selectedId as string,
        { skip: !selectedId }
    );
    const [assignTask] = useAssignPickingTaskMutation();

    const handleAssignGroup = async (e: React.MouseEvent, group: GroupedPicking) => {
        e.stopPropagation();
        try {
            const demoUserId = "00000000-0000-0000-0000-000000000001";
            await Promise.all(group.items.map(i => assignTask({ id: i.id, soItemId: i.soItemId, assigneeId: demoUserId }).unwrap()));
            toast.success(`Đã giao ${group.items.length} tác vụ thành công!`);
        } catch {
            toast.error("Lỗi khi phân công tác vụ!");
        }
    };

    const { groupedData } = useMemo(() => {
        const rawItems = data?.data?.content || [];
        let filtered = [...rawItems];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.salesOrderNumber?.toLowerCase().includes(s) ||
                item.productSku?.toLowerCase().includes(s) ||
                item.productName?.toLowerCase().includes(s) ||
                item.locationCode?.toLowerCase().includes(s)
            );
        }

        const groups: Record<string, GroupedPicking> = {};
        filtered.forEach(item => {
            const soKey = item.salesOrderNumber || item.soItemId || "Unknown SO";
            if (!groups[soKey]) {
                groups[soKey] = { soNumber: soKey, items: [], progress: 0, totalToPick: 0, totalPicked: 0, status: "PENDING" };
            }
            const group = groups[soKey];
            const existing = group.items.find(i => i.productId === item.productId && i.locationCode === item.locationCode);
            if (existing) {
                existing.qtyToPick += item.qtyToPick;
                existing.qtyPicked = (existing.qtyPicked || 0) + (item.qtyPicked || 0);
            } else {
                group.items.push({ ...item });
            }
        });

        const result: GroupedPicking[] = Object.values(groups).map(g => {
            let totalToPickGroup = 0, totalPickedGroup = 0;
            g.items.forEach(i => { totalToPickGroup += i.qtyToPick; totalPickedGroup += (i.qtyPicked || 0); });
            g.items.sort((a, b) => (a.locationCode || "").localeCompare(b.locationCode || ""));
            const progress = totalToPickGroup > 0 ? (totalPickedGroup / totalToPickGroup) * 100 : 0;
            const status = progress === 0 ? "PENDING" : progress === 100 ? "PICKED" : "PARTIAL";
            return { ...g, totalToPick: totalToPickGroup, totalPicked: totalPickedGroup, progress, status };
        });

        result.sort((a, b) => {
            const order = { PARTIAL: 0, PENDING: 1, PICKED: 2 };
            return order[a.status] - order[b.status] || a.soNumber.localeCompare(b.soNumber);
        });

        return { groupedData: result };
    }, [data, searchTerm]);

    const toggleGroup = (so: string) => setExpandedGroups(prev => ({ ...prev, [so]: !prev[so] }));
    const detailItem = detailData?.data;

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <SearchToolbar
                    noContainer
                    placeholder="Tìm theo đơn hàng, SKU, vị trí kho..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                />

                <div className="overflow-x-auto">
                    <Table className="min-w-[720px]">
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-10 px-4 py-3" />
                                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Đơn hàng</TableHead>
                                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mặt hàng</TableHead>
                                <TableHead className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tiến độ</TableHead>
                                <TableHead className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trạng thái</TableHead>
                                <TableHead className="px-4 py-3 pr-6 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <TableCell key={j} className="px-4 py-3">
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : groupedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-0">
                                        <EmptyState
                                            icon={Package2}
                                            title="Không có lệnh lấy hàng"
                                            description="Chưa có đơn hàng nào cần lấy hàng hoặc không khớp tìm kiếm."
                                            className="py-16"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                groupedData.map((group) => (
                                    <React.Fragment key={group.soNumber}>
                                        {/* Group header row */}
                                        <TableRow
                                            className="cursor-pointer hover:bg-muted/50 border-l-2 border-l-transparent data-[expanded=true]:border-l-indigo-400 data-[expanded=true]:bg-indigo-50/30 dark:data-[expanded=true]:bg-indigo-950/10"
                                            data-expanded={expandedGroups[group.soNumber] === true}
                                            onClick={() => toggleGroup(group.soNumber)}
                                        >
                                            <TableCell className="pl-4 py-4">
                                                {expandedGroups[group.soNumber]
                                                    ? <ChevronDown className="h-4 w-4 text-indigo-500" />
                                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-mono text-sm font-bold text-foreground">{group.soNumber}</span>
                                                    <span className="text-[11px] text-muted-foreground">{group.items.length} mặt hàng</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {group.items.slice(0, 2).map(item => (
                                                        <span key={item.id} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            {item.productSku}
                                                        </span>
                                                    ))}
                                                    {group.items.length > 2 && (
                                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                                                            +{group.items.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-foreground">
                                                        {group.totalPicked}/{group.totalToPick}
                                                        <span className={cn(
                                                            "ml-2 rounded px-1 py-0.5 text-[10px]",
                                                            group.progress === 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                                        )}>
                                                            {Math.round(group.progress)}%
                                                        </span>
                                                    </span>
                                                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-700", group.progress === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                                                            style={{ width: `${group.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-center">
                                                <span className={cn("inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold", STATUS_CONFIG[group.status].className)}>
                                                    {STATUS_CONFIG[group.status].label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 pr-6 text-right">
                                                {group.status === "PENDING" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 gap-1.5 rounded-lg text-[11px] font-bold"
                                                        onClick={(e) => handleAssignGroup(e, group)}
                                                    >
                                                        <Users className="h-3.5 w-3.5" />
                                                        Phân công
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded child rows */}
                                        {expandedGroups[group.soNumber] && group.items.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className="bg-slate-50/50 hover:bg-muted/30 animate-in fade-in slide-in-from-left-1 duration-200 dark:bg-slate-950/30"
                                            >
                                                <TableCell className="pl-4 py-3">
                                                    <div className="w-0.5 h-8 rounded-full bg-indigo-200 mx-auto" />
                                                </TableCell>
                                                <TableCell className="py-3 pl-6" colSpan={2}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                                                            <Archive className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-foreground">{item.productSku}</p>
                                                            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[200px]">{item.productName}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <div className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs font-bold text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300">
                                                            <MapPin className="h-3 w-3" />
                                                            {item.locationCode || "—"}
                                                        </div>
                                                        {item.zone && <span className="text-[10px] text-muted-foreground">{item.zone} · {item.aisle}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold tabular-nums text-foreground ring-1 ring-border shadow-sm">
                                                        {item.qtyPicked || 0}/{item.qtyToPick} {item.baseUnit}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 pr-6 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 rounded-lg ring-1 ring-border hover:bg-indigo-50 hover:text-indigo-600 hover:ring-indigo-200"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Detail dialog */}
            <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-lg overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-xl">
                    <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5">
                        <DialogTitle className="flex items-center gap-3 text-base font-bold">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                                <Package2 className="h-5 w-5" />
                            </div>
                            {detailItem?.salesOrderNumber || "Chi tiết lấy hàng"}
                        </DialogTitle>
                    </DialogHeader>

                    {isDetailLoading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : detailItem ? (
                        <div className="space-y-4 p-6">
                            {/* Product info */}
                            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Sản phẩm</p>
                                    <p className="font-black text-base uppercase text-foreground">{detailItem.productSku}</p>
                                    <p className="text-sm text-muted-foreground">{detailItem.productName || "—"}</p>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
                                    <span><strong>Danh mục:</strong> {detailItem.categoryName || "—"}</span>
                                    <span><strong>Barcode:</strong> {detailItem.barcodeEan13 || "—"}</span>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Vị trí lấy hàng</p>
                                    <p className="text-2xl font-black tracking-wider text-indigo-900 dark:text-indigo-100">{detailItem.locationCode || "—"}</p>
                                    {(detailItem.zone || detailItem.aisle) && (
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                            {detailItem.zone && `Khu ${detailItem.zone}`} {detailItem.aisle && `· Dãy ${detailItem.aisle}`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Qty stats */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: "Cần lấy", value: detailItem.qtyToPick },
                                    { label: "Đã lấy", value: detailItem.qtyPicked || 0, highlight: true },
                                    { label: "Tồn kho", value: detailItem.qtyAvailable ?? "—" },
                                ].map(({ label, value, highlight }) => (
                                    <div key={label} className={cn(
                                        "rounded-xl border p-3 text-center",
                                        highlight ? "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30" : "border-border bg-muted/30"
                                    )}>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                                        <p className={cn("mt-1 text-2xl font-black tabular-nums", highlight ? "text-indigo-600" : "text-foreground")}>{value}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{detailItem.baseUnit || "Đv"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-sm font-bold text-muted-foreground">Không tải được dữ liệu</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
