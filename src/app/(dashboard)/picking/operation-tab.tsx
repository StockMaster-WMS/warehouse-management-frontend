"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapPin, CheckCircle2, ChevronRight, Archive, AlertTriangle, ScanLine, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useGetPickingItemsQuery, useUpdatePickingItemMutation, useGetPickingItemByIdQuery, useReportPickingExceptionMutation } from "@/store/services/picking-item.service";

export function OperationTab() {
    const { data: pagedData, isLoading, refetch } = useGetPickingItemsQuery({});

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const allItems = useMemo(() => pagedData?.data?.content || [], [pagedData]);
    const tasks = useMemo(() => allItems.filter(t => t.status === "PENDING"), [allItems]);
    const completedTasks = useMemo(() => allItems.filter(t => t.status === "PICKED"), [allItems]);

    const activeSummary = useMemo(() => {
        if (selectedTaskId) {
            return tasks.find(t => t.id === selectedTaskId) || null;
        }
        return null;
    }, [tasks, selectedTaskId]);

    const { data: detailData } = useGetPickingItemByIdQuery(activeSummary?.id as string, {
        skip: !activeSummary?.id
    });

    const activeItem = useMemo(() => {
        if (!activeSummary) return null;
        if (!detailData?.data) return activeSummary;
        return { ...activeSummary, ...detailData.data };
    }, [activeSummary, detailData]);

    const [updatePickingItem] = useUpdatePickingItemMutation();
    const [reportException] = useReportPickingExceptionMutation();

    const [currentStep, setCurrentStep] = useState<"location" | "sku" | "qty">("location");
    const [scannedLoc, setScannedLoc] = useState("");
    const [scannedSku, setScannedSku] = useState("");
    const [pickedQty, setPickedQty] = useState<string>("");
    const [isExceptionOpen, setIsExceptionOpen] = useState(false);

    const handleScanLocation = () => {
        if (!activeItem) return;
        const expectedLoc = activeItem.locationCode || activeItem.locationId;
        if (scannedLoc.toUpperCase() !== expectedLoc.toUpperCase()) {
            toast.error("Vị trí không khớp! Vui lòng kiểm tra lại kệ/bin.");
            setScannedLoc("");
            return;
        }
        toast.success("Đúng vị trí!");
        setCurrentStep("sku");
    };

    const handleScanSku = () => {
        if (!activeItem) return;
        const expectedSku = activeItem.productSku || activeItem.productCode || activeItem.productId;
        if (scannedSku.toUpperCase() !== expectedSku.toUpperCase() && scannedSku.toUpperCase() !== activeItem.barcodeEan13?.toUpperCase()) {
            toast.error("Mã sản phẩm không khớp!");
            setScannedSku("");
            return;
        }
        toast.success("Xác nhận đúng sản phẩm!");
        setCurrentStep("qty");
        setPickedQty(activeItem.qtyToPick.toString());
    };

    const handleConfirmPick = async () => {
        if (!activeItem) return;
        const qty = Number(pickedQty);
        if (qty < 0 || qty > activeItem.qtyToPick) {
            toast.error("Số lượng nhặt không hợp lệ!");
            return;
        }

        try {
            await updatePickingItem({
                id: activeItem.id,
                soItemId: activeItem.soItemId,
                productId: activeItem.productId,
                locationId: activeItem.locationId,
                qtyToPick: activeItem.qtyToPick,
                qtyPicked: qty,
                status: "PICKED"
            }).unwrap();

            toast.success("Đã lấy hàng xong!");
            setSelectedTaskId(null);
            setCurrentStep("location");
            setScannedLoc("");
            setScannedSku("");
            setPickedQty("");
            refetch();
        } catch {
            toast.error("Có lỗi xảy ra khi cập nhật!");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Đang đồng bộ dữ liệu...</p>
            </div>
        );
    }

    // --- LIST VIEW ---
    if (!activeItem && (tasks.length > 0 || completedTasks.length > 0)) {
        return (
            <div className="mx-auto min-h-screen max-w-sm space-y-5 bg-background px-4 py-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="ui-icon-tile h-10 w-10 bg-primary text-primary-foreground">
                            <ScanLine className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black leading-none text-foreground">LẤY HÀNG</h1>
                            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sẵn sàng vận hành</p>
                        </div>
                    </div>
                </div>

                <div className="ui-surface space-y-3 p-4">
                    <div className="flex justify-between items-center">
                        <span className="ui-label">Tiến độ tổng quát</span>
                        <span className="text-xs font-black text-foreground">{completedTasks.length}/{allItems.length}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${(completedTasks.length / (allItems.length || 1)) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <p className="ui-label">Danh sách chờ ({tasks.length})</p>
                    </div>
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <button
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                className="ui-surface group flex w-full items-center justify-between p-4 text-left transition-all hover:border-primary active:scale-[0.99]"
                            >
                                <div className="space-y-1 min-w-0">
                                    <p className="truncate text-sm font-bold text-foreground">
                                        {task.productName || task.productSku}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground ring-1 ring-border">
                                            {task.locationCode || "BIN-00"}
                                        </span>
                                        <span className="truncate text-[10px] font-medium text-muted-foreground">SO: {task.salesOrderNumber || "—"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pl-4">
                                    <span className="whitespace-nowrap text-sm font-black text-foreground">x{task.qtyToPick}</span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {completedTasks.length > 0 && (
                    <div className="space-y-3 pt-4">
                        <p className="ui-label px-1">Đã hoàn thành gần đây</p>
                        <div className="space-y-2 opacity-60">
                            {completedTasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="ui-muted-surface flex w-full items-center justify-between p-3">
                                    <div className="space-y-0.5">
                                        <p className="max-w-[180px] truncate text-xs font-bold text-muted-foreground line-through">{task.productName || task.productSku}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">{task.locationCode}</p>
                                    </div>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-soft text-success">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- SUCCESS SCREEN (ALL DONE) ---
    if (allItems.length > 0 && tasks.length === 0) {
        return (
            <div className="mx-auto max-w-sm px-6 py-20 text-center">
                <div className="ui-surface space-y-5 p-8 shadow-xl">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success shadow-inner ring-4 ring-background">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-xl font-black uppercase tracking-tight text-foreground">HOÀN TẤT!</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Tuyệt vời! Bạn đã xử lý xong toàn bộ danh sách lấy hàng trong đợt này.
                        </p>
                    </div>
                    <Button
                        onClick={() => refetch()}
                        className="h-12 w-full rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95"
                    >
                        Làm mới danh sách
                    </Button>
                </div>
            </div>
        );
    }

    if (!activeItem) return null;

    // --- ACTIVE PICKING SCREEN (EXECUTION) ---
    return (
        <div className="mx-auto min-h-screen max-w-sm space-y-4 bg-background px-4 py-6">
            <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedTaskId(null);
                            setCurrentStep("location");
                        }}
                        className="ui-surface group flex h-10 w-10 items-center justify-center transition-all active:scale-95"
                    >
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black uppercase leading-none tracking-tight text-foreground">LẤY HÀNG</h1>
                        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Đang thực hiện</p>
                    </div>
                </div>
                <StatusBadge tone="info">Đang chọn</StatusBadge>
            </div>

            <div className="ui-surface relative space-y-4 overflow-hidden p-5">
                <div className="absolute top-0 right-0 p-3">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">
                        #{activeItem.salesOrderNumber || "ORDER"}
                    </span>
                </div>

                <div className="space-y-1.5">
                    <span className="ui-label">Sản phẩm thứ {activeItem.pickSequence || 1}</span>
                    <h2 className="text-base font-black leading-tight text-foreground">
                        {activeItem.productName && activeItem.productName !== "Sản phẩm không tên"
                            ? activeItem.productName
                            : activeItem.productSku}
                    </h2>
                    <p className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">{activeItem.productSku}</p>
                </div>

                <div className="flex items-center gap-4 rounded-lg bg-card">
                    <div className="ui-icon-tile h-12 w-12 bg-primary text-primary-foreground">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="ui-label mb-1 leading-none">Vị trí lưu trữ</p>
                        <p className="truncate text-xl font-black leading-none tracking-tight text-foreground">{activeItem.locationCode || "N/A"}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-border px-1 pt-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Yêu cầu lấy</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black tabular-nums text-foreground">{activeItem.qtyToPick}</span>
                        <span className="text-xs font-bold uppercase text-muted-foreground">{activeItem.baseUnit || "Đơn vị"}</span>
                    </div>
                </div>
            </div>

            <div className="ui-surface space-y-4 p-5">
                {/* Step 1: Location Scan */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStep === "location" ? "text-foreground" : "text-muted-foreground/50")}>
                            BƯỚC 1: XÁC THỰC VỊ TRÍ
                        </span>
                    </div>
                    <div className="relative group">
                        <Input
                            placeholder="QUÉT MÃ KỆ/BIN..."
                            autoFocus={currentStep === "location"}
                            className={cn(
                                "h-14 rounded-lg bg-muted/30 pl-5 pr-12 font-mono text-base font-bold uppercase transition-all focus:bg-card",
                                currentStep !== "location" && "bg-muted/40 opacity-30"
                            )}
                            value={scannedLoc}
                            disabled={currentStep !== "location"}
                            onChange={(e) => setScannedLoc(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleScanLocation()}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                            <MapPin className={cn("h-5 w-5", currentStep === "location" ? "text-primary" : "text-muted-foreground")} />
                        </div>
                    </div>
                </div>

                {/* Step 2: Product Scan */}
                <div className={cn("space-y-2 transition-all duration-300", currentStep !== "sku" && "opacity-30 pointer-events-none")}>
                    <span className={cn("px-1 text-[10px] font-black uppercase tracking-widest", currentStep === "sku" ? "text-foreground" : "text-muted-foreground/50")}>
                        BƯỚC 2: QUÉT MÃ SẢN PHẨM
                    </span>
                    <div className="relative group">
                        <Input
                            placeholder="QUÉT BARCODE SẢN PHẨM..."
                            autoFocus={currentStep === "sku"}
                            className="h-14 rounded-lg bg-muted/30 pl-5 pr-12 font-mono text-base font-bold uppercase focus:bg-card"
                            value={scannedSku}
                            onChange={(e) => setScannedSku(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleScanSku()}
                            disabled={currentStep !== "sku"}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                            <Archive className={cn("h-5 w-5", currentStep === "sku" ? "text-primary" : "text-muted-foreground")} />
                        </div>
                    </div>
                </div>

                {/* Step 3: Quantity Input */}
                <div className={cn("space-y-2 transition-all duration-300", currentStep !== "qty" && "opacity-30 pointer-events-none")}>
                    <span className={cn("px-1 text-[10px] font-black uppercase tracking-widest", currentStep === "qty" ? "text-foreground" : "text-muted-foreground/50")}>
                        BƯỚC 3: XÁC NHẬN SỐ LƯỢNG
                    </span>
                    <div className="relative group">
                        <Input
                            type="number"
                            placeholder="SỐ LƯỢNG THỰC TẾ..."
                            autoFocus={currentStep === "qty"}
                            className="h-14 rounded-lg bg-muted/30 pl-5 pr-12 font-mono text-lg font-black uppercase focus:bg-card"
                            value={pickedQty}
                            onChange={(e) => setPickedQty(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleConfirmPick()}
                            disabled={currentStep !== "qty"}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">
                            SL
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        variant="ghost"
                        className="h-14 flex-1 rounded-lg border border-border text-xs font-bold text-muted-foreground transition-all"
                        onClick={() => setIsExceptionOpen(true)}
                    >
                        Báo lỗi
                    </Button>
                    <Button
                        className="h-14 flex-[2] rounded-lg text-sm font-black shadow-md transition-all active:scale-95 disabled:opacity-20"
                        disabled={currentStep !== "qty"}
                        onClick={handleConfirmPick}
                    >
                        XÁC NHẬN <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Dialog open={isExceptionOpen} onOpenChange={setIsExceptionOpen}>
                <DialogContent className="max-w-[calc(100%-2.5rem)] rounded-lg p-8 shadow-2xl">
                    <DialogHeader className="space-y-4 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-soft text-warning">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Báo lỗi ngoại lệ</DialogTitle>
                            <DialogDescription className="mt-1 text-xs font-bold text-muted-foreground">
                                Chọn nguyên nhân không thể hoàn thành lệnh lấy hàng này.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-6">
                        <Button
                            variant="outline"
                            className="h-14 justify-between rounded-lg px-5 text-xs font-black transition-all"
                            onClick={async () => {
                                if (!activeItem) return;
                                try {
                                    await reportException({ id: activeItem.id, soItemId: activeItem.soItemId, reason: "Hàng bị hỏng/Lỗi" }).unwrap();
                                    setIsExceptionOpen(false);
                                    toast.error("Ghi nhận: Hàng bị hỏng");
                                    setSelectedTaskId(null);
                                    setCurrentStep("location");
                                } catch { toast.error("Lỗi khi kết nối hệ thống!"); }
                            }}
                        >
                            HÀNG BỊ HỎNG / LỖI <ChevronRight className="h-4 w-4 opacity-30" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 justify-between rounded-lg px-5 text-xs font-black transition-all"
                            onClick={async () => {
                                if (!activeItem) return;
                                try {
                                    await reportException({ id: activeItem.id, soItemId: activeItem.soItemId, reason: "Sai vị trí/Thiếu hàng" }).unwrap();
                                    setIsExceptionOpen(false);
                                    toast.error("Ghi nhận: Thiếu hàng tại vị trí");
                                    setSelectedTaskId(null);
                                    setCurrentStep("location");
                                } catch { toast.error("Lỗi khi kết nối hệ thống!"); }
                            }}
                        >
                            THIẾU HÀNG / SAI VỊ TRÍ <ChevronRight className="h-4 w-4 opacity-30" />
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-12 w-full rounded-lg font-bold text-muted-foreground transition-all"
                        onClick={() => setIsExceptionOpen(false)}
                    >
                        Quay về màn hình lấy hàng
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
