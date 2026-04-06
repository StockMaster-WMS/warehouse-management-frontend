"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2, ChevronRight, Package, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useGetPickingItemsQuery, useUpdatePickingItemMutation, useGetPickingItemByIdQuery } from "@/store/services/picking-item.service";

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

    const [currentStep, setCurrentStep] = useState<"location" | "sku" | "qty">("location");
    const [scannedLoc, setScannedLoc] = useState("");
    const [scannedSku, setScannedSku] = useState("");
    const [pickedQty, setPickedQty] = useState<string>("");
    const [isExceptionOpen, setIsExceptionOpen] = useState(false);

    const handleScanLocation = () => {
        if (!activeItem) return;
        const expectedLoc = activeItem.locationCode || activeItem.locationId;
        if (scannedLoc.toUpperCase() !== expectedLoc.toUpperCase()) {
            toast.error("Vị trí không khớp!");
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
            toast.error("Mã không khớp!");
            setScannedSku("");
            return;
        }
        toast.success("Đúng sản phẩm!");
        setCurrentStep("qty");
        setPickedQty(activeItem.qtyToPick.toString());
    };

    const handleConfirmPick = async () => {
        if (!activeItem) return;
        const qty = Number(pickedQty);
        
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
            
            toast.success("Xong!");
            setSelectedTaskId(null);
            setCurrentStep("location");
            setScannedLoc("");
            setScannedSku("");
            setPickedQty("");
            refetch();
        } catch {
            toast.error("Lỗi!");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <p className="text-[10px] font-bold text-slate-400">Đang tải...</p>
            </div>
        );
    }

    // LIST VIEW
    if (!activeItem && (tasks.length > 0 || completedTasks.length > 0)) {
        return (
            <div className="mx-auto max-w-sm space-y-4 px-3 py-4 bg-slate-50/10 min-h-screen">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 shadow-sm text-white">
                            <Package className="h-4 w-4" />
                        </div>
                        <h1 className="text-base font-bold text-slate-800 uppercase tracking-tight">Vận hành</h1>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiến độ</span>
                        <span className="text-[10px] font-bold text-indigo-600">{completedTasks.length} / {allItems.length}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${(completedTasks.length / (allItems.length || 1)) * 100}%` }} />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest px-1">Đang chờ ({tasks.length})</p>
                    <div className="space-y-1.5">
                        {tasks.map((task) => (
                            <button
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-500 transition-all text-left"
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{task.productName || task.productSku}</p>
                                    <p className="text-[9px] font-semibold text-indigo-500 uppercase">{task.locationCode || "BIN-00"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400">×{task.qtyToPick}</span>
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {completedTasks.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <p className="text-[9px] font-bold uppercase text-slate-300 tracking-widest px-1">Gần đây</p>
                        <div className="space-y-1.5 opacity-60">
                            {completedTasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="w-full flex items-center justify-between p-2 blur-[0.2px] bg-slate-50 border border-slate-100 rounded-lg">
                                    <div className="space-y-0">
                                        <p className="text-[10px] font-bold text-slate-500 line-through truncate max-w-[200px]">{task.productName || task.productSku}</p>
                                        <p className="text-[8px] font-medium text-slate-400 uppercase">{task.locationCode}</p>
                                    </div>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // SUCCESS SCREEN
    if (allItems.length > 0 && tasks.length === 0) {
        return (
            <div className="mx-auto max-w-sm border-slate-100 shadow-sm p-8 text-center rounded-xl bg-white border mt-10 space-y-4">
                <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto ring-2 ring-white">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="space-y-1 text-center">
                    <h3 className="font-bold text-base text-slate-800 uppercase">Hoàn tất</h3>
                    <p className="text-xs text-slate-400 font-medium px-4">Bạn đã xử lý xong toàn bộ danh sách.</p>
                </div>
                <Button onClick={() => refetch()} variant="outline" className="w-full h-10 rounded-lg font-bold text-xs border-slate-200">Làm mới</Button>
            </div>
        );
    }

    if (!activeItem) return null;

    // ACTIVE PICKING SCREEN
    return (
        <div className="mx-auto max-w-sm space-y-3 px-3 py-4 bg-slate-50/10 min-h-screen">
            <div className="flex items-center justify-between px-1 mb-1">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            setSelectedTaskId(null);
                            setCurrentStep("location");
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600 rotate-180" />
                    </button>
                    <h1 className="text-base font-bold text-slate-800 uppercase tracking-tight">Lấy hàng</h1>
                </div>
                <div className="rounded-full bg-indigo-50/50 px-2.5 py-0.5 border border-indigo-100">
                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Chọn lọc</span>
                </div>
            </div>
            <div className="rounded-xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-slate-400">SKU {activeItem.pickSequence || 1}</span>
                    <div className="rounded bg-slate-50 px-2 py-0.5 border border-slate-100">
                        <span className="text-[8px] font-bold uppercase text-slate-500">
                            {activeItem.salesOrderNumber || "ORDER"}
                        </span>
                    </div>
                </div>

                <div className="space-y-0">
                    <h2 className="text-sm font-bold text-slate-800 leading-tight">
                        {activeItem.productName && activeItem.productName !== "Sản phẩm không tên" 
                            ? activeItem.productName 
                            : activeItem.productSku}
                    </h2>
                    <p className="text-[9px] font-medium text-slate-400 uppercase">{activeItem.productSku}</p>
                </div>

                <div className="rounded-lg bg-slate-50/50 p-2 border border-slate-100 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                        <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5 leading-none">Vị trí lấy</p>
                        <p className="text-sm font-bold text-slate-800 leading-none truncate">{activeItem.locationCode || "N/A"}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1 border-t border-slate-50 pt-2.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Cần lấy</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-800 tabular-nums">{activeItem.qtyToPick}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">{activeItem.baseUnit || "Chiếc"}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-xl bg-white p-3.5 shadow-sm border border-slate-100 space-y-3.5">
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-0.5">
                        <span className={cn("text-[9px] font-bold uppercase tracking-wide", currentStep === "location" ? "text-indigo-600" : "text-slate-400")}>
                            1. Xác nhận vị trí
                        </span>
                        {currentStep === "location" && <span className="text-[8px] font-medium text-indigo-400 italic">Auto-focus active</span>}
                    </div>
                    <div className="relative group">
                        <Input
                            placeholder="QUÉT MÃ VỊ TRÍ..."
                            autoFocus={currentStep === "location"}
                            className={cn(
                                "h-11 rounded-lg border-slate-200 bg-slate-50/50 pl-3 pr-10 font-mono text-sm uppercase transition-all focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-100",
                                currentStep !== "location" && "opacity-40"
                            )}
                            value={scannedLoc}
                            disabled={currentStep !== "location"}
                            onChange={(e) => setScannedLoc(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleScanLocation()}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-40 group-focus-within:opacity-100 transition-opacity">
                            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                            <Package className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className={cn("space-y-1.5", currentStep !== "sku" && "opacity-40")}>
                    <div className="flex justify-between items-center px-0.5">
                        <span className={cn("text-[9px] font-bold uppercase tracking-wide", currentStep === "sku" ? "text-indigo-600" : "text-slate-400")}>
                            2. Xác nhận sản phẩm
                        </span>
                    </div>
                    <div className="relative group">
                        <Input
                            placeholder="QUÉT BARCODE SP..."
                            autoFocus={currentStep === "sku"}
                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 pl-3 pr-10 font-mono text-sm uppercase focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-100"
                            value={scannedSku}
                            onChange={(e) => setScannedSku(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleScanSku()}
                            disabled={currentStep !== "sku"}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-40 group-focus-within:opacity-100 transition-opacity">
                            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                            <Archive className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-1">
                    <Button variant="secondary" className="flex-1 h-11 rounded-lg font-bold text-xs text-slate-400 bg-slate-100" onClick={() => setIsExceptionOpen(true)}>Báo lỗi</Button>
                    <Button
                        className="flex-[1.5] h-11 rounded-lg bg-slate-800 hover:bg-slate-900 border border-slate-800 text-white font-bold text-xs shadow-sm transition-all"
                        disabled={currentStep !== "qty"}
                        onClick={handleConfirmPick}
                    >
                        Hoàn tất <CheckCircle2 className="ml-1.5 h-3.5 w-3.5 opacity-70" />
                    </Button>
                </div>
                <p className="text-[8px] text-center font-medium text-slate-300 italic">Hệ thống tự động kích hoạt máy quét chuyên dụng</p>
            </div>

            <Dialog open={isExceptionOpen} onOpenChange={setIsExceptionOpen}>
                <DialogContent className="max-w-[calc(100%-2rem)] rounded-xl border-none p-8 shadow-2xl">
                    <DialogHeader className="space-y-3 text-center">
                        <div className="h-14 w-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-1">
                             <Archive className="h-7 w-7 text-rose-500" />
                        </div>
                        <DialogTitle className="text-base font-bold text-slate-800 uppercase tracking-tight">Ngoại lệ</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-slate-400 px-2">
                             Chọn lý do không thể lấy hàng.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                        <Button variant="outline" className="h-12 justify-between rounded-lg border-slate-200 px-4 font-bold text-xs" onClick={() => { setIsExceptionOpen(false); toast.success("Đã ghi nhận!"); }}>
                            Hàng bị hỏng <ChevronRight className="h-3.5 w-3.5 opacity-20" />
                        </Button>
                        <Button variant="outline" className="h-12 justify-between rounded-lg border-slate-200 px-4 font-bold text-xs" onClick={() => { setIsExceptionOpen(false); toast.success("Lấy thiếu"); }}>
                            Lấy thiếu <ChevronRight className="h-3.5 w-3.5 opacity-20" />
                        </Button>
                    </div>
                    <Button type="button" variant="secondary" className="w-full h-11 rounded-lg font-bold text-slate-400 bg-slate-50" onClick={() => setIsExceptionOpen(false)}>Quay lại</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
