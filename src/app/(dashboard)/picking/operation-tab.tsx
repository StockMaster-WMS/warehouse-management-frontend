"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    Barcode,
    Box,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Filter,
    HelpCircle,
    Info,
    Keyboard,
    ListFilter,
    MapPin,
    Package,
    PackageCheck,
    Pause,
    Play,
    RefreshCw,
    ScanLine,
    SlidersHorizontal,
    Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    useCompleteMobilePickingMutation,
    useGetPickingItemByIdQuery,
    useGetPickingItemsQuery,
    useReportPickingExceptionMutation,
} from "@/store/services/picking-item.service";
import { playErrorSound, playSuccessSound } from "@/lib/audio-utils";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { taskScopeErrMessage } from "@/types/api";
import type { PickingItem } from "@/types/picking-item";
import {
    displayPickingLocation,
    displayPickingWarehouse,
    groupPickingLocations,
    groupPickingOrders,
    type PickingLocationGroup,
    type PickingOrder,
    type PickingOrderSort,
} from "./operation-utils";

function priorityText(priority: PickingOrder["priority"]) {
    if (priority === "high") return "Ưu tiên cao";
    if (priority === "medium") return "Ưu tiên trung bình";
    return "Ưu tiên thấp";
}

function priorityClasses(priority: PickingOrder["priority"]) {
    if (priority === "high") return "bg-rose-50 text-rose-600 ring-rose-100";
    if (priority === "medium") return "bg-orange-50 text-orange-600 ring-orange-100";
    return "bg-sky-50 text-sky-600 ring-sky-100";
}

function splitLocation(location: string) {
    const parts = location.split("-").filter(Boolean);
    return {
        rack: parts[0] ? `${parts[0]}-${parts[1] || "01"}` : "A-01",
        floor: parts[2] || "02",
        bin: parts[3] || "03",
    };
}

function pickingLocationParts(item: PickingItem) {
    const fallback = splitLocation(displayPickingLocation(item));
    return {
        code: displayPickingLocation(item),
        zone: item.zone || fallback.rack,
        aisle: item.aisle || "",
        shelf: item.shelf || fallback.floor,
        position: item.position || fallback.bin,
    };
}

export function OperationTab() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: pagedData, isLoading, refetch, isFetching } = useGetPickingItemsQuery({
        status: "PENDING",
        salesOrderStatus: "PICKING",
        size: 50,
    });

    const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [isExceptionOpen, setIsExceptionOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<"location" | "sku" | "qty">("location");
    const [scannedLoc, setScannedLoc] = useState("");
    const [scannedSku, setScannedSku] = useState("");
    const [pickedQty, setPickedQty] = useState<string>("");
    const [orderTab, setOrderTab] = useState<"all" | "completed">("all");
    const [queueView, setQueueView] = useState<"orders" | "locations">("orders");
    const [orderSort, setOrderSort] = useState<PickingOrderSort>("sequence");
    const [scanInputMode, setScanInputMode] = useState<"camera" | "manual">("camera");

    const allItems = useMemo(() => pagedData?.data?.content || [], [pagedData]);
    const orders = useMemo(() => groupPickingOrders(allItems, orderSort), [allItems, orderSort]);
    const locationQueue = useMemo(() => groupPickingLocations(allItems), [allItems]);

    const selectedOrder = useMemo(
        () => orders.find((order) => order.soNumber === selectedOrderNumber) || orders[0] || null,
        [orders, selectedOrderNumber],
    );
    const completedOrders = useMemo(() => orders.filter((order) => order.progress >= 100), [orders]);
    const displayedOrders = orderTab === "completed" ? completedOrders : orders;
    const selectedTaskSummary = useMemo(
        () => (activeTaskId ? allItems.find((item) => item.id === activeTaskId) || null : null),
        [activeTaskId, allItems],
    );
    const activeOrder = useMemo(
        () => orders.find((order) => order.items.some((item) => item.id === activeTaskId)) || null,
        [activeTaskId, orders],
    );
    const activeTaskIndex = useMemo(
        () => activeOrder?.items.findIndex((item) => item.id === activeTaskId) ?? -1,
        [activeOrder, activeTaskId],
    );
    const { data: detailData } = useGetPickingItemByIdQuery(selectedTaskSummary?.id as string, { skip: !selectedTaskSummary?.id });
    const activeItem = useMemo(() => {
        if (!selectedTaskSummary) return null;
        if (!detailData?.data) return selectedTaskSummary;
        return { ...selectedTaskSummary, ...detailData.data };
    }, [selectedTaskSummary, detailData]);

    const [completeMobile] = useCompleteMobilePickingMutation();
    const [reportException] = useReportPickingExceptionMutation();

    const stats = useMemo(() => {
        const totalOrders = orders.length;
        const totalLocations = new Set(allItems.map(displayPickingLocation)).size;
        const totalQty = orders.reduce((sum, order) => sum + order.totalToPick, 0);
        const totalPicked = orders.reduce((sum, order) => sum + order.totalPicked, 0);
        const progress = totalQty ? Math.round((totalPicked / totalQty) * 100) : 0;
        return { totalOrders, totalLocations, totalQty, totalPicked, progress };
    }, [allItems, orders]);

    const resetState = () => {
        setCurrentStep("location");
        setScannedLoc("");
        setScannedSku("");
        setPickedQty("");
        setScanInputMode("camera");
    };

    const updateTaskUrl = (taskId: string | null, mode: "push" | "replace" = "push") => {
        const params = new URLSearchParams(searchParams.toString());
        if (taskId) {
            params.set("taskId", taskId);
        } else {
            params.delete("taskId");
        }
        const query = params.toString();
        const url = query ? `${pathname}?${query}` : pathname;
        router[mode](url, { scroll: false });
    };

    const startTask = (task: PickingItem) => {
        setActiveTaskId(task.id);
        resetState();
        updateTaskUrl(task.id);
    };

    const closeActiveTask = () => {
        setActiveTaskId(null);
        resetState();
        updateTaskUrl(null);
    };

    const goToAdjacentTask = (direction: "prev" | "next") => {
        if (!activeOrder || activeTaskIndex < 0) return;
        const nextIndex = direction === "prev" ? activeTaskIndex - 1 : activeTaskIndex + 1;
        const nextTask = activeOrder.items[nextIndex];
        if (!nextTask) return;
        setActiveTaskId(nextTask.id);
        resetState();
        updateTaskUrl(nextTask.id, "replace");
    };

    useEffect(() => {
        const taskIdFromUrl = searchParams.get("taskId");
        let cancelled = false;
        const syncTask = (taskId: string | null) => {
            queueMicrotask(() => {
                if (cancelled) return;
                setActiveTaskId(taskId);
                resetState();
            });
        };

        if (!taskIdFromUrl) {
            if (activeTaskId) {
                syncTask(null);
            }
            return () => {
                cancelled = true;
            };
        }
        if (activeTaskId !== taskIdFromUrl && allItems.some((item) => item.id === taskIdFromUrl)) {
            syncTask(taskIdFromUrl);
        }
        return () => {
            cancelled = true;
        };
    }, [activeTaskId, allItems, searchParams]);

    const handleScanLocation = (val?: string) => {
        if (!activeItem) return;
        const input = (val || scannedLoc).trim().toUpperCase();
        const expected = (activeItem.locationCode || "").trim().toUpperCase();
        if (!expected) {
            toast.error("Nhiệm vụ chưa có mã vị trí kệ. Vui lòng báo quản lý kiểm tra lại.");
            return;
        }
        if (input !== expected) {
            playErrorSound();
            toast.error(`Sai vị trí! Cần: ${expected}`);
            setScannedLoc("");
            return;
        }
        playSuccessSound();
        toast.success("Đúng vị trí kệ.");
        setScannedLoc(input);
        setCurrentStep("sku");
    };

    const handleScanSku = (val?: string) => {
        if (!activeItem) return;
        const input = (val || scannedSku).trim().toUpperCase();
        const expectedSku = (activeItem.productSku || "").trim().toUpperCase();
        const expectedBarcode = (activeItem.barcodeEan13 || "").trim().toUpperCase();
        if (input !== expectedSku && input !== expectedBarcode) {
            playErrorSound();
            toast.error("Sai sản phẩm. Vui lòng quét lại.");
            setScannedSku("");
            return;
        }
        playSuccessSound();
        toast.success("Xác thực sản phẩm thành công.");
        setScannedSku(input);
        setCurrentStep("qty");
        setPickedQty(activeItem.qtyToPick.toString());
    };

    const handleConfirmPick = async () => {
        if (!activeItem) return;
        const confirmedQty = Number(pickedQty);
        if (!Number.isFinite(confirmedQty) || confirmedQty <= 0) {
            toast.error("Số lượng xác nhận không hợp lệ.");
            return;
        }
        if (confirmedQty !== Number(activeItem.qtyToPick)) {
            toast.error("Số lượng xác nhận phải đúng bằng số lượng cần lấy. Nếu thiếu hàng, dùng Báo lỗi.");
            return;
        }
        try {
            await completeMobile(activeItem.id).unwrap();
            playSuccessSound();
            toast.success("Hoàn tất lấy hàng.");
            const nextTask = activeOrder && activeTaskIndex >= 0 ? activeOrder.items[activeTaskIndex + 1] : null;
            if (nextTask) {
                setActiveTaskId(nextTask.id);
                resetState();
                updateTaskUrl(nextTask.id, "replace");
            } else {
                closeActiveTask();
            }
            refetch();
        } catch (err) {
            playErrorSound();
            toast.error(taskScopeErrMessage(err));
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
                <div className="size-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="text-xs font-semibold text-slate-500">Đang tải nhiệm vụ lấy hàng...</p>
            </div>
        );
    }

    if (orders.length === 0 && !activeItem) {
        return (
            <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 rounded-lg border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
                <div className="flex size-16 items-center justify-center rounded-lg bg-emerald-100">
                    <CheckCircle2 className="size-10 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-950">Bạn chưa có nhiệm vụ được phân công.</h2>
                    <p className="mt-1 text-sm text-slate-500">Khi quản lý kho phân công lệnh lấy hàng, nhiệm vụ sẽ xuất hiện tại đây.</p>
                </div>
                <Button type="button" variant="outline" className="gap-2" onClick={() => refetch()}>
                    <RefreshCw className="size-4" />
                    Tải lại danh sách
                </Button>
            </div>
        );
    }

    if (activeItem) {
        return (
            <PickingScanFlow
                activeItem={activeItem}
                currentStep={currentStep}
                isExceptionOpen={isExceptionOpen}
                orders={orders}
                pickedQty={pickedQty}
                scanInputMode={scanInputMode}
                scannedLoc={scannedLoc}
                scannedSku={scannedSku}
                canGoNext={Boolean(activeOrder && activeTaskIndex >= 0 && activeTaskIndex < activeOrder.items.length - 1)}
                canGoPrev={Boolean(activeOrder && activeTaskIndex > 0)}
                onBack={closeActiveTask}
                onConfirmPick={handleConfirmPick}
                onExceptionOpenChange={setIsExceptionOpen}
                onGoPrev={() => goToAdjacentTask("prev")}
                onReportException={async (reason, label) => {
                    try {
                        await reportException({ id: activeItem.id, soItemId: activeItem.soItemId, reason }).unwrap();
                        setIsExceptionOpen(false);
                        toast.warning(`Ghi nhận: ${label}`);
                        closeActiveTask();
                    } catch (err) {
                        toast.error(taskScopeErrMessage(err));
                    }
                }}
                onScanInputModeChange={setScanInputMode}
                onScanLocation={handleScanLocation}
                onScanSku={handleScanSku}
                onSetPickedQty={setPickedQty}
                onSetScannedLoc={setScannedLoc}
                onSetScannedSku={setScannedSku}
            />
        );
    }

    return (
        <div className="min-h-full bg-slate-50 px-4 pb-6 pt-2 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-0 lg:pt-0">
            <PickingHeader
                isFetching={isFetching}
                onRefresh={() => refetch()}
                onStartFirstTask={() => {
                    const firstTask = displayedOrders[0]?.items[0] ?? orders[0]?.items[0];
                    if (firstTask) {
                        startTask(firstTask);
                    } else {
                        toast.info("Không có nhiệm vụ lấy hàng để quét.");
                    }
                }}
            />
            <PickingStats stats={stats} />
            <PickingQueueControls
                orderSort={orderSort}
                queueView={queueView}
                onOrderSortChange={setOrderSort}
                onQueueViewChange={setQueueView}
            />

            {queueView === "locations" ? (
                <LocationQueue groups={locationQueue} onStartTask={startTask} />
            ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.85fr)]">
                <div className={cn("space-y-4", selectedOrderNumber ? "hidden lg:block" : "block")}>
                    <PickingTabs
                        activeTab={orderTab}
                        completedCount={completedOrders.length}
                        totalCount={orders.length}
                        onTabChange={setOrderTab}
                    />
                    <div className="space-y-3">
                        {displayedOrders.map((order, index) => (
                            <OrderCard
                                key={order.soNumber}
                                active={selectedOrder?.soNumber === order.soNumber}
                                index={index}
                                order={order}
                                onOpen={() => setSelectedOrderNumber(order.soNumber)}
                                onStart={() => startTask(order.items[0])}
                            />
                        ))}
                        {displayedOrders.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-medium text-slate-500">
                                Chưa có đơn hoàn thành.
                            </div>
                        ) : null}
                    </div>                 
                </div>

                <div className={cn("lg:block", selectedOrderNumber ? "block" : "hidden lg:block")}>
                    {selectedOrder ? (
                        <OrderDetail
                            order={selectedOrder}
                            onBack={() => setSelectedOrderNumber(null)}
                            onStartOrder={() => startTask(selectedOrder.items[0])}
                            onStartTask={startTask}
                        />
                    ) : null}
                </div>
            </div>
            )}
        </div>
    );
}

function PickingQueueControls({
    orderSort,
    queueView,
    onOrderSortChange,
    onQueueViewChange,
}: {
    orderSort: PickingOrderSort;
    queueView: "orders" | "locations";
    onOrderSortChange: (sort: PickingOrderSort) => void;
    onQueueViewChange: (view: "orders" | "locations") => void;
}) {
    return (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <Button type="button" variant="ghost" size="sm" className={cn("h-8 rounded-md", queueView === "orders" && "bg-white text-indigo-600 shadow-sm")} onClick={() => onQueueViewChange("orders")}>
                    Theo đơn
                </Button>
                <Button type="button" variant="ghost" size="sm" className={cn("h-8 rounded-md", queueView === "locations" && "bg-white text-indigo-600 shadow-sm")} onClick={() => onQueueViewChange("locations")}>
                    Theo vị trí
                </Button>
            </div>
            {queueView === "orders" ? (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Sắp xếp</span>
                    {([
                        ["sequence", "Thứ tự pick"],
                        ["order", "Mã đơn"],
                        ["location", "Vị trí đầu"],
                    ] as const).map(([sort, label]) => (
                        <Button
                            key={sort}
                            type="button"
                            variant={orderSort === sort ? "default" : "outline"}
                            size="sm"
                            className={cn("h-8 rounded-lg", orderSort === sort && "bg-indigo-600 hover:bg-indigo-700")}
                            onClick={() => onOrderSortChange(sort)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            ) : (
                <p className="text-xs font-medium text-slate-500">Các nhiệm vụ cùng vị trí được gom để giảm lượt di chuyển.</p>
            )}
        </div>
    );
}

function LocationQueue({
    groups,
    onStartTask,
}: {
    groups: PickingLocationGroup[];
    onStartTask: (task: PickingItem) => void;
}) {
    return (
        <div className="mt-5 rounded-lg border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-base font-semibold">Hàng chờ theo vị trí</h2>
                    <p className="text-sm text-slate-500">{groups.length} vị trí đang có nhiệm vụ lấy hàng.</p>
                </div>
            </div>
            <div className="space-y-3">
                {groups.map((group, index) => (
                    <div key={group.location} className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <MapPin className="size-4 text-indigo-600" />
                                <span className="font-semibold text-indigo-600">{group.location}</span>
                                <span className="text-slate-500">{group.orderNumbers.join(", ")}</span>
                            </div>
                            <span className="font-semibold text-slate-600">{group.totalPicked}/{group.totalToPick} đã lấy</span>
                        </div>
                        <LocationSection index={index} items={group.items} location={group.location} onStartTask={onStartTask} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function PickingHeader({
    isFetching,
    onRefresh,
    onStartFirstTask,
}: {
    isFetching: boolean;
    onRefresh: () => void;
    onStartFirstTask: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
                <div className="hidden size-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 sm:flex">
                    <ClipboardList className="size-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Lấy hàng</h1>
                    <p className="text-sm font-medium text-slate-500">Nhiệm vụ hôm nay</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-8 gap-2 rounded-full border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Nhân viên kho
                </Badge>
                <Button type="button" className="hidden h-10 gap-2 rounded-lg bg-indigo-600 px-4 shadow-sm hover:bg-indigo-700 sm:flex" onClick={onRefresh}>
                    <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
                    Tải lại
                </Button>
                <Button type="button" size="icon" className="size-11 rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 sm:hidden" onClick={onStartFirstTask}>
                    <ScanLine className="size-5" />
                </Button>
            </div>
        </div>
    );
}

function PickingStats({ stats }: { stats: { totalOrders: number; totalLocations: number; totalQty: number; totalPicked: number; progress: number } }) {
    const items = [
        { icon: Box, label: "Đơn hàng", value: stats.totalOrders, tone: "bg-indigo-100 text-indigo-600" },
        { icon: SlidersHorizontal, label: "Vị trí kho", value: stats.totalLocations, tone: "bg-blue-100 text-blue-600" },
        { icon: PackageCheck, label: "Tổng số lượng", value: stats.totalQty, tone: "bg-emerald-100 text-emerald-600" },
    ];

    return (
        <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm sm:p-5">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-[1.5fr_repeat(3,1fr)] sm:items-center">
                <div className="hidden sm:block">
                    <p className="text-xs font-medium text-slate-500">Tiến độ hôm nay</p>
                    <div className="mt-2 flex items-end gap-2">
                        <span className="text-3xl font-semibold tabular-nums">{stats.totalPicked}</span>
                        <span className="pb-1 text-2xl font-semibold text-slate-400">/ {stats.totalQty}</span>
                        <span className="pb-1 text-sm font-medium text-slate-500">đã lấy</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${stats.progress}%` }} />
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{stats.progress}%</span>
                    </div>
                </div>
                {items.map(({ icon: Icon, label, value, tone }) => (
                    <div key={label} className="flex min-w-0 items-center gap-2 border-slate-100 sm:border-l sm:gap-3 sm:pl-5">
                        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-11", tone)}>
                            <Icon className="size-4 sm:size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg font-semibold tabular-nums leading-none sm:text-2xl">{value}</p>
                            <p className="mt-1 truncate text-[11px] font-medium text-slate-500 sm:text-xs">{label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PickingTabs({
    activeTab,
    completedCount,
    totalCount,
    onTabChange,
}: {
    activeTab: "all" | "completed";
    completedCount: number;
    totalCount: number;
    onTabChange: (tab: "all" | "completed") => void;
}) {
    return (
        <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-6">
                <button
                    type="button"
                    onClick={() => onTabChange("all")}
                    className={cn(
                        "border-b-2 px-2 pb-3 text-sm font-semibold transition-colors",
                        activeTab === "all" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700",
                    )}
                >
                    Tất cả đơn ({totalCount})
                </button>
                <button
                    type="button"
                    onClick={() => onTabChange("completed")}
                    className={cn(
                        "border-b-2 px-2 pb-3 text-sm font-semibold transition-colors",
                        activeTab === "completed" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700",
                    )}
                >
                    Đã hoàn thành ({completedCount})
                </button>
            </div>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="mb-2 size-10 rounded-lg border-slate-200 bg-white lg:hidden"
                onClick={() => onTabChange(activeTab === "all" ? "completed" : "all")}
                aria-label="Đổi tab đơn hàng"
            >
                <Filter className="size-4" />
            </Button>
        </div>
    );
}

function OrderCard({
    active,
    index,
    order,
    onOpen,
    onStart,
}: {
    active: boolean;
    index: number;
    order: PickingOrder;
    onOpen: () => void;
    onStart: () => void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen();
                }
            }}
            className={cn(
                "w-full cursor-pointer rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                active ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-100",
            )}
        >
            <div className="grid grid-cols-[auto_1fr_auto] gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-slate-50 text-base font-semibold">{index + 1}</div>
                <div className="min-w-0">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", priorityClasses(order.priority))}>
                        ↑ {priorityText(order.priority)}
                    </span>
                    <h3 className="mt-3 text-base font-semibold tracking-tight">{order.soNumber}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-600">{order.locations.length} vị trí kho</p>
                    <p className="text-sm font-medium text-slate-500">{order.totalPicked} / {order.totalToPick} sản phẩm đã lấy</p>
                    <Button
                        type="button"
                        variant={index === 0 ? "default" : "outline"}
                        className={cn("mt-4 h-10 gap-2 rounded-lg px-5 text-sm font-bold sm:hidden", index === 0 && "bg-indigo-600 hover:bg-indigo-700")}
                        onClick={(event) => {
                            event.stopPropagation();
                            onStart();
                        }}
                    >
                        <Play className="size-4" />
                        Bắt đầu lấy
                    </Button>
                </div>
                <div className="flex min-w-[88px] flex-col items-end justify-between">
                    <div className="space-y-1 text-right text-sm">
                        <p>
                            <span className="font-semibold">{order.locations.length}</span> vị trí
                        </p>
                        <p>
                            <span className="font-semibold">{order.totalToPick}</span> sản phẩm
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-full bg-slate-50 text-sm font-semibold text-slate-700">
                            {order.progress}%
                        </div>
                        <ChevronRight className="size-5 text-slate-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrderDetail({
    order,
    onBack,
    onStartOrder,
    onStartTask,
}: {
    order: PickingOrder;
    onBack: () => void;
    onStartOrder: () => void;
    onStartTask: (task: PickingItem) => void;
}) {
    const groupedByLocation = useMemo(() => {
        const grouped = new Map<string, PickingItem[]>();
        order.items.forEach((item) => {
            const key = displayPickingLocation(item);
            grouped.set(key, [...(grouped.get(key) || []), item]);
        });
        return Array.from(grouped.entries());
    }, [order.items]);

    return (
        <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                    <Button type="button" variant="outline" size="icon" className="size-10 rounded-lg lg:hidden" onClick={onBack}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{order.soNumber}</h2>
                            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", priorityClasses(order.priority))}>
                                ↑ {priorityText(order.priority)}
                            </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                            <InfoBlock label="Đơn hàng" value={order.soNumber} />
                            <InfoBlock label="Vị trí kho" value={`${order.locations.length} vị trí`} />
                            <InfoBlock label="Tổng số lượng" value={`${order.totalToPick} sản phẩm`} />
                            <InfoBlock label="Trạng thái" value="Chờ lấy" badge />
                        </div>
                    </div>
                    <Button type="button" className="hidden h-12 gap-2 rounded-lg bg-indigo-600 px-6 font-bold hover:bg-indigo-700 sm:flex" onClick={onStartOrder}>
                        <Play className="size-4" />
                        Bắt đầu lấy đơn này
                    </Button>
                </div>
            </div>

            <div className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-500">Chi tiết hàng cần lấy ({order.locations.length} vị trí)</p>
                </div>

                <div className="space-y-3">
                    {groupedByLocation.map(([location, items], index) => (
                        <LocationSection key={location} index={index} items={items} location={location} onStartTask={onStartTask} />
                    ))}
                </div>

                <div className="mt-6 sm:hidden">
                    <div className="mb-2 flex items-center justify-between text-sm font-bold">
                        <span>{order.totalPicked} / {order.totalToPick} sản phẩm đã lấy</span>
                        <span>{order.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-indigo-600" style={{ width: `${order.progress}%` }} />
                    </div>
                    <Button type="button" className="mt-6 h-12 w-full gap-2 rounded-lg bg-indigo-600 text-base font-bold hover:bg-indigo-700" onClick={onStartOrder}>
                        <Play className="size-5" />
                        Bắt đầu lấy đơn này
                    </Button>
                </div>
            </div>
        </div>
    );
}

function InfoBlock({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
    return (
        <div className="min-w-0 border-slate-100 sm:border-l sm:pl-4">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            {badge ? (
                <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-600">{value}</span>
            ) : (
                <p className="mt-1 truncate text-sm font-semibold">{value}</p>
            )}
        </div>
    );
}

function LocationSection({
    index,
    items,
    location,
    onStartTask,
}: {
    index: number;
    items: PickingItem[];
    location: string;
    onStartTask: (task: PickingItem) => void;
}) {
    const loc = splitLocation(location);
    return (
        <div className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">{index + 1}</span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-indigo-600">{location}</p>
                            <p className="text-sm font-semibold text-slate-500">Kệ: {loc.rack}</p>
                            <p className="text-sm font-semibold text-slate-500">Tầng: {loc.floor}</p>
                            <p className="text-sm font-semibold text-slate-500">Ô: {loc.bin}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <span>{items.length} sản phẩm</span>
                    <ChevronDown className="size-4" />
                </div>
            </div>
            <div className="divide-y divide-slate-100">
                {items.map((item) => (
                    <ProductRow key={item.id} item={item} onStart={() => onStartTask(item)} />
                ))}
            </div>
        </div>
    );
}

function ProductRow({ item, onStart }: { item: PickingItem; onStart: () => void }) {
    return (
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_120px_140px_110px] sm:items-center">
            <div className="flex min-w-0 gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-slate-50 text-indigo-600">
                    <Package className="size-7" />
                </div>
                <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold">{item.productName || item.productSku || "Sản phẩm"}</p>
                    <span className="mt-2 inline-flex rounded bg-indigo-100 px-2 py-1 text-[11px] font-bold text-indigo-600">
                        {item.productSku || item.productCode || "SKU"}
                    </span>
                    <p className="mt-2 text-xs font-semibold text-slate-500 sm:hidden">Đơn vị: {item.baseUnit || "Cái"}</p>
                </div>
            </div>
            <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-500">Đơn vị</p>
                <p className="mt-1 text-sm font-semibold">{item.baseUnit || "Cái"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:block">
                <div>
                    <p className="text-xs font-semibold text-slate-500">Số lượng cần lấy</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums sm:text-lg">{item.qtyToPick}</p>
                </div>
                <div className="sm:hidden">
                    <p className="text-xs font-semibold text-slate-500">Đã lấy</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{item.qtyPicked || 0}</p>
                </div>
            </div>
            <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-500">Đã lấy</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{item.qtyPicked || 0}</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end">
                <Button type="button" variant="outline" className="h-10 rounded-lg border-indigo-200 px-5 font-bold text-indigo-600 hover:bg-indigo-50" onClick={onStart}>
                    Lấy hàng
                </Button>
                <ChevronRight className="size-5 text-slate-400 sm:hidden" />
            </div>
        </div>
    );
}

function ProductVisual({ className }: { className?: string }) {
    return (
        <div className={cn("flex shrink-0 items-center justify-center rounded-lg bg-slate-50 text-indigo-600", className)}>
            <Package className="size-2/3" />
        </div>
    );
}

function DesktopStat({ label, value, badge, className }: { label: string; value: string; badge?: string; className?: string }) {
    return (
        <div className="border-l border-slate-100 px-6 first:border-l-0 first:px-0">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <div className="mt-2 flex items-center gap-3">
                <p className={cn("text-xl font-semibold tabular-nums", className)}>{value}</p>
                {badge ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600">{badge}</span> : null}
            </div>
        </div>
    );
}

function DesktopOrderRail({ activeSo, orders }: { activeSo: string; orders: PickingOrder[] }) {

    return (
        <div className="space-y-4 rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">Danh sách đơn hàng ({orders.length})</h2>
            </div>
            <div className="space-y-3">
                {orders.map((order) => (
                    <div key={order.soNumber} className={cn("rounded-lg border bg-white p-4 shadow-sm", order.soNumber === activeSo ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-100")}>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <p className="font-semibold">{order.soNumber}</p>
                                    <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold ring-1", priorityClasses(order.priority))}>{priorityText(order.priority)}</span>
                                </div>
                                <p className="mt-3 text-sm font-medium text-slate-500">{order.locations.length} vị trí <span className="mx-1">•</span> {order.totalToPick} sản phẩm</p>
                            </div>
                            {order.soNumber === activeSo ? <span className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-white"><ChevronRight className="size-5" /></span> : null}
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-sm font-semibold">{order.totalPicked} / {order.totalToPick}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${order.progress}%` }} />
                            </div>
                            <span className="text-sm font-semibold">{order.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 text-sm font-semibold text-slate-600">
                Mẹo: Bạn có thể quét mã trên thiết bị cầm tay hoặc nhập mã sản phẩm thủ công.
            </div>
        </div>
    );
}

function MobileStepProgress({ stepIndex }: { stepIndex: number }) {
    const steps = ["Quét vị trí kệ", "Quét sản phẩm", "Xác nhận số lượng"];
    return (
        <div className="my-3 grid grid-cols-3 items-start gap-2">
            {steps.map((label, index) => {
                const step = index + 1;
                return (
                    <div key={label} className="relative flex flex-col items-center gap-1.5 text-center">
                        {index < 2 ? <div className={cn("absolute left-1/2 top-4 h-0.5 w-full", stepIndex > step ? "bg-indigo-600" : "bg-slate-200")} /> : null}
                        <span className={cn("relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-bold", step === stepIndex ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-950")}>{step}</span>
                        <p className={cn("text-[11px] font-semibold leading-tight", step === stepIndex ? "text-indigo-600" : "text-slate-500")}>{label}</p>
                    </div>
                );
            })}
        </div>
    );
}

function MobileProductCard({ activeItem, loc }: { activeItem: PickingItem; loc: ReturnType<typeof pickingLocationParts> }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                <Warehouse className="size-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase text-emerald-700">Kho lấy hàng</p>
                    <p className="truncate text-sm font-bold text-emerald-800">{displayPickingWarehouse(activeItem)}</p>
                </div>
            </div>
            <div className="grid grid-cols-[56px_1fr] gap-3">
                <ProductVisual className="h-16 w-14" />
                <div className="relative min-w-0">
                    <Package className="absolute right-0 top-1 size-10 text-slate-100" />
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Sản phẩm cần lấy</p>
                    <h2 className="relative mt-0.5 line-clamp-2 text-sm font-bold leading-snug">{activeItem.productName || activeItem.productSku}</h2>
                    <p className="relative mt-1 text-xs font-semibold text-slate-500">{activeItem.productSku}</p>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-[1.25fr_0.8fr] gap-2">
                <div className="rounded-lg bg-indigo-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600"><MapPin className="size-3.5" />Vị trí kệ</p>
                    <p className="mt-1 truncate text-lg font-bold text-indigo-600">{loc.code}</p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                        <div className="rounded-md bg-white px-1 py-1">
                            <p className="text-[10px] font-medium text-slate-400">Kệ</p>
                            <p className="truncate text-xs font-bold text-slate-700">{loc.zone}</p>
                        </div>
                        <div className="rounded-md bg-white px-1 py-1">
                            <p className="text-[10px] font-medium text-slate-400">Tầng</p>
                            <p className="truncate text-xs font-bold text-slate-700">{loc.shelf}</p>
                        </div>
                        <div className="rounded-md bg-white px-1 py-1">
                            <p className="text-[10px] font-medium text-slate-400">Ô</p>
                            <p className="truncate text-xs font-bold text-slate-700">{loc.position}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs font-semibold text-slate-600">Cần lấy</p>
                    <p className="mt-1 text-3xl font-bold leading-none text-slate-950">{activeItem.qtyToPick}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{activeItem.baseUnit || "Cái"}</p>
                </div>
            </div>
        </div>
    );
}

function MobileStepCards({
    currentStep,
    pickedQty,
    scannedLoc,
    scannedSku,
    onManualSubmit,
    onScanLocation,
    onScanSku,
    onShowGuide,
    onSetPickedQty,
    onSetScannedLoc,
    onSetScannedSku,
}: {
    currentStep: "location" | "sku" | "qty";
    pickedQty: string;
    scannedLoc: string;
    scannedSku: string;
    onManualSubmit: () => void;
    onScanLocation: (value?: string) => void;
    onScanSku: (value?: string) => void;
    onShowGuide: () => void;
    onSetPickedQty: (value: string) => void;
    onSetScannedLoc: (value: string) => void;
    onSetScannedSku: (value: string) => void;
}) {
    const stepIndex = currentStep === "location" ? 1 : currentStep === "sku" ? 2 : 3;
    return (
        <div className="mt-3 space-y-3">
            <MobileActiveStep
                active={currentStep === "location"}
                done={stepIndex > 1}
                label="Bước 1 - Quét vị trí kệ"
                step={1}
                value={scannedLoc}
                placeholder="Nhập mã vị trí"
                onChange={onSetScannedLoc}
                onManualSubmit={onManualSubmit}
                onScan={onScanLocation}
                onShowGuide={onShowGuide}
            />
            <MobileActiveStep
                active={currentStep === "sku"}
                done={stepIndex > 2}
                label="Bước 2 - Quét mã sản phẩm"
                step={2}
                value={scannedSku}
                placeholder="Nhập mã sản phẩm"
                onChange={onSetScannedSku}
                onManualSubmit={onManualSubmit}
                onScan={onScanSku}
                onShowGuide={onShowGuide}
            />
        <div className={cn("rounded-xl border bg-white p-3 shadow-sm", currentStep === "qty" ? "border-indigo-200" : "border-slate-100")}>
                <div className="flex items-center gap-2.5">
                    <span className={cn("flex size-8 items-center justify-center rounded-full text-sm font-bold", currentStep === "qty" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-950")}>3</span>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">Bước 3 - Xác nhận số lượng</p>
                        <p className="text-xs font-medium text-slate-500">Xác nhận và hoàn tất việc lấy hàng</p>
                    </div>
                    <ChevronDown className="size-4 text-slate-500" />
                </div>
                {currentStep === "qty" ? (
                    <Input type="number" value={pickedQty} onChange={(event) => onSetPickedQty(event.target.value)} className="mt-3 h-11 text-center text-xl font-semibold" />
                ) : null}
            </div>
        </div>
    );
}

function MobileActiveStep({
    active,
    done,
    label,
    step,
    value,
    placeholder,
    onChange,
    onManualSubmit,
    onScan,
    onShowGuide,
}: {
    active: boolean;
    done: boolean;
    label: string;
    step: number;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    onManualSubmit: () => void;
    onScan: (value?: string) => void;
    onShowGuide: () => void;
}) {
    return (
        <div className={cn("rounded-xl border bg-white p-3 shadow-sm", active ? "border-indigo-200" : "border-slate-100")}>
            <div className="flex items-center gap-2.5">
                <span className={cn("flex size-8 items-center justify-center rounded-full text-sm font-bold", active ? "bg-indigo-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-950")}>{done ? <CheckCircle2 className="size-5" /> : step}</span>
                <div className="flex-1">
                    <p className="text-sm font-bold text-indigo-600">{label}</p>
                    {!active ? <p className="text-xs font-medium text-slate-500">{step === 2 ? "Quét từng sản phẩm để ghi nhận số lượng" : "Đưa mã kệ vào vùng quét"}</p> : null}
                </div>
                {active ? (
                    <Button variant="outline" className="h-8 rounded-lg border-indigo-200 px-2 text-xs font-semibold text-indigo-600" onClick={onShowGuide}>
                        <HelpCircle className="mr-1 size-3.5" />
                        Hướng dẫn
                    </Button>
                ) : <ChevronDown className="size-4 text-slate-500" />}
            </div>
            {active ? (
                <div className="mt-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-3 text-center">
                    <Barcode className="mx-auto size-8 text-indigo-600" />
                    <h3 className="mt-2 text-base font-bold text-slate-700">Quét mã {step === 1 ? "KỆ / VỊ TRÍ" : "SẢN PHẨM"}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">Đưa mã vạch vào vùng quét</p>
                    <div className="mt-3 overflow-hidden rounded-lg">
                        <BarcodeScanner
                            className="min-h-[130px] rounded-lg [&_video]:max-h-[130px] [&_video]:object-cover"
                            qrbox={{ width: 150, height: 100 }}
                            onScanSuccess={onScan}
                            onScanError={() => toast.error("Cần cấp quyền Camera để quét.")}
                        />
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 bg-white text-center text-sm font-semibold" />
                        <Button variant="outline" className="h-10 shrink-0 rounded-lg bg-white px-3 text-xs font-semibold" onClick={onManualSubmit}>
                            <Keyboard className="mr-1.5 size-3.5" />
                            Nhập mã
                        </Button>
                    </div>
                    <div className="mt-3 rounded-lg bg-white/80 py-2 text-xs font-semibold text-slate-400">
                        {done ? "Đã quét đúng vị trí" : "Đang chờ quét"}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function PickingScanFlow({
    activeItem,
    canGoNext,
    canGoPrev,
    currentStep,
    isExceptionOpen,
    orders,
    pickedQty,
    scanInputMode,
    scannedLoc,
    scannedSku,
    onBack,
    onConfirmPick,
    onExceptionOpenChange,
    onGoPrev,
    onReportException,
    onScanInputModeChange,
    onScanLocation,
    onScanSku,
    onSetPickedQty,
    onSetScannedLoc,
    onSetScannedSku,
}: {
    activeItem: PickingItem;
    canGoNext: boolean;
    canGoPrev: boolean;
    currentStep: "location" | "sku" | "qty";
    isExceptionOpen: boolean;
    orders: PickingOrder[];
    pickedQty: string;
    scanInputMode: "camera" | "manual";
    scannedLoc: string;
    scannedSku: string;
    onBack: () => void;
    onConfirmPick: () => void;
    onExceptionOpenChange: (open: boolean) => void;
    onGoPrev: () => void;
    onReportException: (reason: string, label: string) => Promise<void>;
    onScanInputModeChange: (mode: "camera" | "manual") => void;
    onScanLocation: (val?: string) => void;
    onScanSku: (val?: string) => void;
    onSetPickedQty: (value: string) => void;
    onSetScannedLoc: (value: string) => void;
    onSetScannedSku: (value: string) => void;
}) {
    const stepIndex = currentStep === "location" ? 1 : currentStep === "sku" ? 2 : 3;
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const loc = pickingLocationParts(activeItem);
    const warehouseLabel = displayPickingWarehouse(activeItem);
    const picked = Number(activeItem.qtyPicked || 0);
    const remaining = Math.max(Number(activeItem.qtyToPick || 0) - picked, 0);
    const progress = activeItem.qtyToPick ? Math.round((picked / Number(activeItem.qtyToPick)) * 100) : 0;
    const handleManualSubmit = () => {
        if (currentStep === "location") onScanLocation(scannedLoc);
        if (currentStep === "sku") onScanSku(scannedSku);
    };

    useEffect(() => {
        const media = window.matchMedia("(max-width: 639px)");
        const sync = () => setIsMobileViewport(media.matches);
        sync();
        media.addEventListener("change", sync);
        return () => media.removeEventListener("change", sync);
    }, []);

    return (
        <div className="bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
            {isMobileViewport ? (
                <div className="min-h-screen bg-slate-50">
                    <div className="bg-slate-50 px-3 pb-20 pt-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={onBack} className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-600 shadow-sm">
                                    <ArrowLeft className="size-5" />
                                </button>
                                <div>
                                    <p className="text-xs font-medium text-slate-500">Đang thực hiện</p>
                                    <p className="text-base font-semibold">{activeItem.salesOrderNumber || "Đơn hiện tại"}</p>
                                    <p className="mt-0.5 max-w-[190px] truncate text-xs font-semibold text-emerald-700">{warehouseLabel}</p>
                                </div>
                            </div>
                            <div className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600">{stepIndex} / 3</div>
                        </div>

                        <MobileStepProgress stepIndex={stepIndex} />
                        <MobileProductCard activeItem={activeItem} loc={loc} />
                        <MobileStepCards
                            currentStep={currentStep}
                            pickedQty={pickedQty}
                            scannedLoc={scannedLoc}
                            scannedSku={scannedSku}
                            onManualSubmit={handleManualSubmit}
                            onScanLocation={onScanLocation}
                            onScanSku={onScanSku}
                            onShowGuide={() => toast.info("Quét đúng mã vị trí trước, sau đó quét mã sản phẩm và xác nhận số lượng.")}
                            onSetPickedQty={onSetPickedQty}
                            onSetScannedLoc={onSetScannedLoc}
                            onSetScannedSku={onSetScannedSku}
                        />
                    </div>

                    <div className="fixed inset-x-0 bottom-0 grid grid-cols-[0.8fr_1.9fr] gap-2 border-t border-slate-200 bg-white px-3 py-2">
                        <Button variant="outline" className="h-11 rounded-xl border-red-200 text-sm font-semibold text-red-600" onClick={() => onExceptionOpenChange(true)}>
                            <AlertTriangle className="mr-1.5 size-4" />
                            Báo lỗi
                        </Button>
                        <Button className="h-11 rounded-xl bg-indigo-600 text-sm font-semibold hover:bg-indigo-700" onClick={currentStep === "qty" ? onConfirmPick : onBack}>
                            {currentStep === "qty" ? "Hoàn tất" : "Tạm dừng"} <Pause className="ml-2 size-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="min-h-full space-y-4 p-5">
                    <div className="grid grid-cols-6 rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                        <DesktopStat label="Tiến độ đơn hàng" value={activeItem.salesOrderNumber || "SO"} badge="Ưu tiên cao" />
                        <DesktopStat label="Kho lấy hàng" value={warehouseLabel} className="text-emerald-700" />
                        <DesktopStat label="Tổng sản phẩm" value={String(activeItem.qtyToPick)} />
                        <DesktopStat label="Đã lấy" value={String(picked)} className="text-emerald-600" />
                        <DesktopStat label="Còn lại" value={String(remaining)} className="text-red-600" />
                        <div className="border-l border-slate-100 px-8">
                            <p className="text-xs font-medium text-slate-500">Tỷ lệ hoàn thành</p>
                            <div className="mt-2 flex items-center gap-3">
                                <span className="text-xl font-semibold">{progress}%</span>
                                <div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
                        <DesktopOrderRail activeSo={activeItem.salesOrderNumber || "SO"} orders={orders} />
                        <div className="space-y-0 rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-600">Sản phẩm hiện tại <span className="ml-3 font-semibold text-indigo-600">1 / 3 vị trí</span></p>
                                <Button variant="outline" className="h-10 gap-2 rounded-lg text-indigo-600" onClick={onBack}><ListFilter className="size-4" />Xem danh sách</Button>
                            </div>
                            <div className="grid grid-cols-[1fr_150px_130px] items-center gap-5 rounded-lg border border-slate-100 p-4 shadow-sm">
                                <div className="flex items-center gap-5">
                                    <ProductVisual className="size-20" />
                                    <div>
                                        <div className="flex items-start gap-3">
                                            <h2 className="max-w-xl text-base font-semibold leading-snug">{activeItem.productName || activeItem.productSku}</h2>
                                            <span className="shrink-0 rounded bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-600">{activeItem.productSku}</span>
                                        </div>
                                        <p className="mt-3 text-sm font-medium text-slate-500">Vị trí kho: <span className="text-base font-semibold text-indigo-600">{loc.code}</span></p>
                                        <p className="mt-2 text-xs font-medium text-slate-500">Kệ: {loc.zone} <span className="mx-2">•</span> Tầng: {loc.shelf} <span className="mx-2">•</span> Ô: {loc.position}</p>
                                    </div>
                                </div>
                                <div className="border-l border-slate-100 px-5">
                                    <p className="text-xs font-medium text-slate-500">Số lượng cần lấy</p>
                                    <p className="mt-2 text-2xl font-semibold">{activeItem.qtyToPick} <span className="text-sm font-medium text-slate-500">{activeItem.baseUnit || "Cái"}</span></p>
                                </div>
                                <div className="border-l border-slate-100 px-5">
                                    <p className="text-xs font-medium text-slate-500">Đã lấy</p>
                                    <p className="mt-2 text-2xl font-semibold text-emerald-600">{picked}</p>
                                    <p className="mt-2 text-xs font-medium text-slate-500">Còn lại: <span className="font-semibold text-red-600">{remaining}</span></p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-lg border border-slate-100">
                                <div className="flex">
                                    <button
                                        type="button"
                                        className={cn(
                                            "flex h-12 items-center gap-2 rounded-tl-lg border-r px-8 text-sm font-semibold",
                                            scanInputMode === "camera" ? "border-indigo-200 border-t-2 border-t-indigo-600 text-indigo-600" : "border-slate-100 text-slate-600",
                                        )}
                                        onClick={() => onScanInputModeChange("camera")}
                                    >
                                        <ScanLine className="size-4" />
                                        Quét mã sản phẩm
                                    </button>
                                    <button
                                        type="button"
                                        className={cn(
                                            "flex h-12 items-center gap-2 border-r border-slate-100 px-8 text-sm font-semibold",
                                            scanInputMode === "manual" ? "border-t-2 border-t-indigo-600 text-indigo-600" : "text-slate-600",
                                        )}
                                        onClick={() => onScanInputModeChange("manual")}
                                    >
                                        <Keyboard className="size-4" />
                                        Nhập mã thủ công
                                    </button>
                                </div>
                                <div className="border-t border-slate-100 p-5">
                                    <div>
                                        <div className="mb-4 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-slate-600">
                                            <Info className="size-4 text-blue-500" />
                                            {currentStep === "location" ? "Quét mã vị trí kệ để bắt đầu lấy hàng" : currentStep === "sku" ? "Quét mã vạch / QR code trên sản phẩm để xác nhận đã lấy hàng" : "Nhập số lượng và hoàn tất lấy hàng"}
                                        </div>
                                        {currentStep === "qty" ? (
                                            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-8">
                                                <Input type="number" value={pickedQty} onChange={(event) => onSetPickedQty(event.target.value)} className="h-14 text-center text-2xl font-semibold" />
                                                <Button className="h-12 w-full bg-indigo-600 font-bold hover:bg-indigo-700" onClick={onConfirmPick}>Hoàn tất lấy hàng</Button>
                                            </div>
                                        ) : scanInputMode === "camera" ? (
                                            <div className="mx-auto max-w-xl">
                                                <BarcodeScanner
                                                    className="min-h-[220px] rounded-xl [&_video]:max-h-[220px] [&_video]:object-cover"
                                                    qrbox={{ width: 220, height: 140 }}
                                                    onScanSuccess={(text) => currentStep === "location" ? onScanLocation(text) : onScanSku(text)}
                                                    onScanError={() => toast.error("Cần cấp quyền Camera để quét.")}
                                                />
                                                <div className="mt-4 flex gap-3">
                                                    <Input value={currentStep === "location" ? scannedLoc : scannedSku} onChange={(event) => currentStep === "location" ? onSetScannedLoc(event.target.value) : onSetScannedSku(event.target.value)} placeholder={currentStep === "location" ? "Nhập mã vị trí" : "Nhập mã sản phẩm"} />
                                                    <Button variant="outline" onClick={handleManualSubmit}>Nhập mã thủ công</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mx-auto flex max-w-xl gap-3 py-10">
                                                <Input
                                                    className="h-12 text-base font-medium"
                                                    value={currentStep === "location" ? scannedLoc : scannedSku}
                                                    onChange={(event) => currentStep === "location" ? onSetScannedLoc(event.target.value) : onSetScannedSku(event.target.value)}
                                                    onKeyDown={(event) => event.key === "Enter" && handleManualSubmit()}
                                                    placeholder={currentStep === "location" ? "Nhập mã vị trí" : "Nhập mã sản phẩm"}
                                                />
                                                <Button className="h-12 bg-indigo-600 px-6 font-semibold hover:bg-indigo-700" onClick={handleManualSubmit}>
                                                    Xác nhận
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
                                <CheckCircle2 className="size-8" />
                                <div>
                                    <p className="font-semibold">{stepIndex > 1 ? "Quét thành công!" : "Sẵn sàng quét"}</p>
                                    <p className="text-sm font-semibold">{stepIndex > 1 ? `Đã lấy ${picked || 1} ${activeItem.baseUnit || "Cái"}` : "Đưa mã vào vùng quét để xác nhận"}</p>
                                </div>
                            </div>
                            <div className="mt-5 grid grid-cols-[240px_1fr] gap-6">
                                <Button variant="outline" className="h-14 gap-3 rounded-lg font-semibold" disabled={!canGoPrev} onClick={onGoPrev}><ArrowLeft className="size-4" />Sản phẩm trước</Button>
                                <Button className="h-14 gap-3 rounded-lg bg-indigo-600 font-semibold hover:bg-indigo-700" disabled={currentStep !== "qty"} onClick={onConfirmPick}>
                                    {canGoNext ? "Hoàn tất và sang sản phẩm tiếp theo" : "Hoàn tất sản phẩm"} <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={isExceptionOpen} onOpenChange={onExceptionOpenChange}>
                <DialogContent className="max-w-[calc(100%-2.5rem)] rounded-3xl border-none p-7 shadow-2xl">
                    <DialogHeader className="space-y-4 text-center">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50">
                            <AlertTriangle className="size-8 text-amber-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-slate-900">Báo lỗi ngoại lệ</DialogTitle>
                            <DialogDescription className="mt-1 text-xs text-slate-400">Chọn lý do bạn không thể hoàn thành nhiệm vụ này.</DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="mt-4 flex flex-col gap-3">
                        {[
                            { label: "Hàng bị hỏng / lỗi", reason: "Hàng bị hỏng/Lỗi" },
                            { label: "Thiếu hàng / sai vị trí", reason: "Sai vị trí/Thiếu hàng" },
                        ].map(({ label, reason }) => (
                            <Button key={reason} variant="outline" className="h-14 justify-between rounded-2xl border-slate-100 px-5 text-xs font-semibold hover:bg-slate-50" onClick={() => onReportException(reason, label)}>
                                {label} <ChevronRight className="size-4 opacity-30" />
                            </Button>
                        ))}
                    </div>
                    <Button variant="ghost" className="mt-2 h-11 w-full rounded-xl text-sm font-bold text-slate-400 hover:text-slate-600" onClick={() => onExceptionOpenChange(false)}>
                        Hủy và quay lại
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
