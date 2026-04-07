"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2, ChevronRight, Package, Archive, AlertTriangle, ScanLine, ArrowLeft } from "lucide-react";
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

            toast.success("Đã nhặt hàng xong!");
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
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Đang đồng bộ dữ liệu...</p>
            </div>
        );
    }

    // --- LIST VIEW ---
    if (!activeItem && (tasks.length > 0 || completedTasks.length > 0)) {
        return (
            <div className="mx-auto max-w-sm space-y-5 px-4 py-6 bg-slate-50/50 min-h-screen">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg text-white">
                            <ScanLine className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-slate-900 leading-none">NHẶT HÀNG</h1>
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-1">Sẵn sàng vận hành</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiến độ tổng quát</span>
                        <span className="text-xs font-black text-indigo-600">{completedTasks.length}/{allItems.length}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                            style={{ width: `${(completedTasks.length / (allItems.length || 1)) * 100}%` }} 
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Danh sách chờ ({tasks.length})</p>
                    </div>
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <button
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-500 hover:shadow-md active:scale-[0.98] transition-all text-left group"
                            >
                                <div className="space-y-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600">
                                        {task.productName || task.productSku}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 uppercase">
                                            {task.locationCode || "BIN-00"}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400 truncate">SO: {task.salesOrderNumber || "—"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pl-4">
                                    <span className="text-sm font-black text-slate-900 whitespace-nowrap">×{task.qtyToPick}</span>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {completedTasks.length > 0 && (
                    <div className="space-y-3 pt-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Đã hoàn thành gần đây</p>
                        <div className="space-y-2 opacity-60">
                            {completedTasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-500 line-through truncate max-w-[180px]">{task.productName || task.productSku}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{task.locationCode}</p>
                                    </div>
                                    <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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
                <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-8 space-y-5">
                    <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto ring-4 ring-white shadow-inner">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">HOÀN TẤT!</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Tuyệt vời! Bạn đã xử lý xong toàn bộ danh sách nhặt hàng trong đợt này.
                        </p>
                    </div>
                    <Button 
                        onClick={() => refetch()} 
                        className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-sm shadow-lg active:scale-95 transition-all"
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
        <div className="mx-auto max-w-sm space-y-4 px-4 py-6 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedTaskId(null);
                            setCurrentStep("location");
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:bg-white active:scale-90 transition-all group"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-indigo-600" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">NHẶT HÀNG</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Đang thực hiện</p>
                    </div>
                </div>
                <div className="rounded-full bg-indigo-600 px-3 py-1 shadow-md shadow-indigo-100">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">ĐANG CHỌN</span>
                </div>
            </div>

            {/* Product Card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                    <div className="rounded-md bg-slate-900/5 px-2 py-1 border border-slate-900/10">
                        <span className="text-[9px] font-black uppercase text-slate-600">
                            #{activeItem.salesOrderNumber || "ORDER"}
                        </span>
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Sản phẩm thứ {activeItem.pickSequence || 1}</span>
                    <h2 className="text-base font-black text-slate-900 leading-tight">
                        {activeItem.productName && activeItem.productName !== "Sản phẩm không tên"
                            ? activeItem.productName
                            : activeItem.productSku}
                    </h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{activeItem.productSku}</p>
                </div>

                {/* Location Info */}
                <div className="rounded-2xl bg-slate-900 p-4 flex items-center gap-4 transition-all hover:scale-[1.01]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase text-white/50 mb-1 leading-none tracking-widest">Vị trí lưu trữ</p>
                        <p className="text-xl font-black text-white leading-none truncate tracking-tight">{activeItem.locationCode || "N/A"}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1 border-t border-slate-50 pt-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Yêu cầu lấy</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900 tabular-nums">{activeItem.qtyToPick}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">{activeItem.baseUnit || "Đơn vị"}</span>
                    </div>
                </div>
            </div>

            {/* Interaction Steps */}
            <div className="rounded-2xl bg-white p-5 shadow-md border border-slate-100 space-y-4">
                {/* Step 1: Location Scan */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStep === "location" ? "text-indigo-600" : "text-slate-300")}>
                            BƯỚC 1: XÁC THỰC VỊ TRÍ
                        </span>
                        {currentStep === "location" && <span className="animate-pulse flex h-2 w-2 rounded-full bg-indigo-500" />}
                    </div>
                    <div className="relative group">
                        <Input
                            placeholder="QUÉT MÃ KỆ/BIN..."
                            autoFocus={currentStep === "location"}
                            className={cn(
                                "h-14 rounded-xl border-slate-100 bg-slate-50/50 pl-5 pr-12 font-mono text-base font-bold uppercase transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100",
                                currentStep !== "location" && "opacity-30 bg-slate-100"
                            )}
                            value={scannedLoc}
                            disabled={currentStep !== "location"}
                            onChange={(e) => setScannedLoc(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleScanLocation()}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                            <MapPin className={cn("h-5 w-5", currentStep === "location" ? "text-indigo-600" : "text-slate-400")} />
                        </div>
                    </div>
                </div>

                {/* Step 2: Product Scan */}
                <div className={cn("space-y-2 transition-all duration-300", currentStep !== "sku" && "opacity-30 pointer-events-none")}>
                    <div className="flex justify-between items-center px-1">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStep === "sku" ? "text-indigo-600" : "text-slate-300")}>
                            BƯỚC 2: QUÉT MÃ SẢN PHẨM
                        </span>
                        {currentStep === "sku" && <span className="animate-pulse flex h-2 w-2 rounded-full bg-indigo-500" />}
                    </div>
                    <div className="relative group">
                        <Input
                            placeholder="QUÉT BARCODE SẢN PHẨM..."
                            autoFocus={currentStep === "sku"}
                            className="h-14 rounded-xl border-slate-100 bg-slate-50/50 pl-5 pr-12 font-mono text-base font-bold uppercase focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            value={scannedSku}
                            onChange={(e) => setScannedSku(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleScanSku()}
                            disabled={currentStep !== "sku"}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                            <Archive className={cn("h-5 w-5", currentStep === "sku" ? "text-indigo-600" : "text-slate-400")} />
                        </div>
                    </div>
                </div>

                {/* Step 3: Quantity Input */}
                <div className={cn("space-y-2 transition-all duration-300", currentStep !== "qty" && "opacity-30 pointer-events-none")}>
                    <div className="flex justify-between items-center px-1">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStep === "qty" ? "text-indigo-600" : "text-slate-300")}>
                            BƯỚC 3: XÁC NHẬN SỐ LƯỢNG
                        </span>
                        {currentStep === "qty" && <span className="animate-pulse flex h-2 w-2 rounded-full bg-indigo-500" />}
                    </div>
                    <div className="relative group">
                        <Input
                            type="number"
                            placeholder="SỐ LƯỢNG THỰC TẾ..."
                            autoFocus={currentStep === "qty"}
                            className="h-14 rounded-xl border-slate-100 bg-slate-50/50 pl-5 pr-12 font-mono text-lg font-black uppercase focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            value={pickedQty}
                            onChange={(e) => setPickedQty(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleConfirmPick()}
                            disabled={currentStep !== "qty"}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">
                            SL
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <Button 
                        variant="secondary" 
                        className="flex-1 h-14 rounded-xl font-bold text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 border-none transition-all" 
                        onClick={() => setIsExceptionOpen(true)}
                    >
                        <AlertTriangle className="mr-2 h-4 w-4" /> Báo lỗi
                    </Button>
                    <Button
                        className="flex-[2] h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-20"
                        disabled={currentStep !== "qty"}
                        onClick={handleConfirmPick}
                    >
                        XÁC NHẬN <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                </div>
                <p className="text-[10px] text-center font-bold text-slate-300 italic tracking-tight">Hệ thống đang chờ lệnh từ máy quét PDA...</p>
            </div>

            {/* Exception Dialog */}
            <Dialog open={isExceptionOpen} onOpenChange={setIsExceptionOpen}>
                <DialogContent className="max-w-[calc(100%-2.5rem)] rounded-3xl border-none p-8 shadow-2xl">
                    <DialogHeader className="space-y-4 text-center">
                        <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                            <AlertTriangle className="h-8 w-8 text-rose-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Báo lỗi ngoại lệ</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-slate-400 mt-1">
                                Chọn nguyên nhân không thể hoàn thành lệnh nhặt hàng này.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-6">
                        <Button 
                            variant="outline" 
                            className="h-14 justify-between rounded-2xl border-slate-100 px-5 font-black text-xs hover:border-rose-400 hover:text-rose-500 transition-all shadow-sm" 
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
                            className="h-14 justify-between rounded-2xl border-slate-100 px-5 font-black text-xs hover:border-rose-400 hover:text-rose-500 transition-all shadow-sm" 
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
                        className="w-full h-12 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all" 
                        onClick={() => setIsExceptionOpen(false)}
                    >
                        Quay về màn hình nhặt hàng
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
