"use client";

import { useMemo, useState } from "react";
import { MapPin, CheckCircle2, ChevronRight, AlertTriangle, ScanLine, ArrowLeft, Package, Hash, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetPickingItemsQuery, useGetPickingItemByIdQuery, useReportPickingExceptionMutation, useCompleteMobilePickingMutation } from "@/store/services/picking-item.service";
import { playSuccessSound, playErrorSound } from "@/lib/audio-utils";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { taskScopeErrMessage } from "@/types/api";

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepDot({ step, current, done }: { step: number; current: number; done: boolean }) {
    const active = step === current;
    return (
        <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all duration-300",
            done ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                : active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-slate-100 text-slate-400"
        )}>
            {done ? <CheckCircle2 className="h-4 w-4" /> : step}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function OperationTab() {
    const { data: pagedData, isLoading, refetch } = useGetPickingItemsQuery({ status: "PENDING", size: 50 });

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isExceptionOpen, setIsExceptionOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<"location" | "sku" | "qty">("location");
    const [scannedLoc, setScannedLoc] = useState("");
    const [scannedSku, setScannedSku] = useState("");
    const [pickedQty, setPickedQty] = useState<string>("");

    const allItems = useMemo(() => pagedData?.data?.content || [], [pagedData]);
    const tasks = useMemo(() => allItems.toSorted((a, b) => (a.pickSequence || 0) - (b.pickSequence || 0)), [allItems]);

    const activeSummary = useMemo(() => selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null, [tasks, selectedTaskId]);
    const { data: detailData } = useGetPickingItemByIdQuery(activeSummary?.id as string, { skip: !activeSummary?.id });
    const activeItem = useMemo(() => {
        if (!activeSummary) return null;
        if (!detailData?.data) return activeSummary;
        return { ...activeSummary, ...detailData.data };
    }, [activeSummary, detailData]);

    const [completeMobile] = useCompleteMobilePickingMutation();
    const [reportException] = useReportPickingExceptionMutation();

    const resetState = () => {
        setCurrentStep("location");
        setScannedLoc("");
        setScannedSku("");
        setPickedQty("");
    };

    const handleScanLocation = (val?: string) => {
        if (!activeItem) return;
        const input = (val || scannedLoc).trim().toUpperCase();
        const expected = (activeItem.locationCode || "").trim().toUpperCase();
        if (input !== expected) {
            playErrorSound();
            toast.error(`Sai vị trí! Cần: ${expected}`);
            setScannedLoc("");
            return;
        }
        playSuccessSound();
        toast.success("✓ Đúng vị trí kệ!");
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
            toast.error("Sai sản phẩm! Vui lòng quét lại.");
            setScannedSku("");
            return;
        }
        playSuccessSound();
        toast.success("✓ Xác thực sản phẩm thành công!");
        setScannedSku(input);
        setCurrentStep("qty");
        setPickedQty(activeItem.qtyToPick.toString());
    };

    const handleConfirmPick = async () => {
        if (!activeItem) return;
        try {
            await completeMobile(activeItem.id).unwrap();
            playSuccessSound();
            toast.success("✓ Hoàn tất lấy hàng!");
            refetch();
            if (tasks.length <= 1) {
                toast.success("Đã hoàn thành tất cả nhiệm vụ!");
                setSelectedTaskId(null);
            } else {
                setSelectedTaskId(null);
                resetState();
            }
        } catch (err) {
            playErrorSound();
            toast.error(taskScopeErrMessage(err));
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Đang đồng bộ dữ liệu...</p>
            </div>
        );
    }

    // ── Empty ──────────────────────────────────────────────────────────────────
    if (tasks.length === 0 && !activeItem) {
        return (
            <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-6 px-4 py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Bạn chưa có nhiệm vụ được phân công.</h2>
                    <p className="mt-1 text-sm text-slate-500">Các nhiệm vụ picking được giao cho bạn sẽ xuất hiện tại đây.</p>
                </div>
            </div>
        );
    }

    // ── Task list ──────────────────────────────────────────────────────────────
    if (!activeItem) {
        return (
            <div className="mx-auto max-w-sm space-y-5 px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">LỆNH LẤY HÀNG</h1>
                        <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{tasks.length} nhiệm vụ chờ</p>
                        </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                        <ClipboardList className="h-6 w-6" />
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn hàng</p>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                            {new Set(tasks.map(t => t.salesOrderNumber)).size}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-indigo-600 p-4 shadow-lg shadow-indigo-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Sản phẩm</p>
                        <p className="mt-1 text-2xl font-black text-white">{tasks.length}</p>
                    </div>
                </div>

                {/* Task list */}
                <div className="space-y-3">
                    <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Danh sách chờ xử lý</p>
                    {tasks.map((task, idx) => (
                        <button
                            key={task.id}
                            onClick={() => { setSelectedTaskId(task.id); resetState(); }}
                            className="group relative flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left border border-slate-100 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md active:scale-[0.98] dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-700"
                        >
                            {/* Sequence number */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 font-black text-sm text-slate-700 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                {idx + 1}
                            </div>

                            {/* Product info */}
                            <div className="flex-1 min-w-0">
                                <p className="truncate font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                    {task.productName || task.productSku}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                        <Hash className="h-2.5 w-2.5" />{task.productSku}
                                    </span>
                                    <span className="text-slate-200 dark:text-slate-700">·</span>
                                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">SO: {task.salesOrderNumber?.slice(-8)}</span>
                                </div>
                            </div>

                            {/* Right side: location + qty */}
                            <div className="flex shrink-0 flex-col items-end gap-1">
                                <div className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {task.locationCode || "N/A"}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">×{task.qtyToPick} {task.baseUnit}</span>
                            </div>

                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ── Active picking screen ──────────────────────────────────────────────────
    const stepIndex = currentStep === "location" ? 1 : currentStep === "sku" ? 2 : 3;

    return (
        <div className="mx-auto max-w-sm space-y-4 px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => { setSelectedTaskId(null); resetState(); }}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-500 shadow-sm transition-all active:scale-90 hover:border-indigo-200 hover:text-indigo-600 dark:bg-slate-900 dark:border-slate-800"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Đang thực hiện</p>
                    <p className="font-black text-slate-900 dark:text-white">LẤY HÀNG</p>
                </div>
                <div className="flex h-11 items-center rounded-2xl bg-indigo-50 px-3 text-[10px] font-black text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400">
                    {stepIndex}/3
                </div>
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-2 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <StepDot step={1} current={stepIndex} done={stepIndex > 1} />
                <div className={cn("h-0.5 flex-1 rounded-full transition-all duration-500", stepIndex > 1 ? "bg-emerald-400" : "bg-slate-100")} />
                <StepDot step={2} current={stepIndex} done={stepIndex > 2} />
                <div className={cn("h-0.5 flex-1 rounded-full transition-all duration-500", stepIndex > 2 ? "bg-emerald-400" : "bg-slate-100")} />
                <StepDot step={3} current={stepIndex} done={false} />
            </div>

            {/* Product hero card */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <div className="absolute right-4 top-4 opacity-5">
                    <Package className="h-24 w-24" />
                </div>
                <div className="relative space-y-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sản phẩm cần lấy</p>
                        <h2 className="mt-1 text-lg font-black leading-tight text-slate-900 dark:text-white">
                            {activeItem.productName && activeItem.productName !== "Sản phẩm không tên"
                                ? activeItem.productName : activeItem.productSku}
                        </h2>
                        <p className="mt-0.5 font-mono text-xs font-bold text-slate-400 uppercase">{activeItem.productSku}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-indigo-600 p-4 shadow-md shadow-indigo-200">
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Vị trí kệ</p>
                            <p className="mt-1 text-lg font-black text-white tracking-wider">{activeItem.locationCode || "N/A"}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 dark:bg-slate-800 dark:border-slate-700">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Số lượng</p>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-lg font-black text-slate-900 dark:text-white">{activeItem.qtyToPick}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{activeItem.baseUnit || "cái"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step cards */}
            <div className="space-y-3">
                {/* Step 1: Location */}
                {[
                    { key: "location" as const, step: 1, icon: MapPin, label: "Bước 1 · Quét vị trí kệ", placeholder: "QUÉT MÃ KỆ...", value: scannedLoc, setter: setScannedLoc, onEnter: handleScanLocation, done: stepIndex > 1 },
                    { key: "sku" as const, step: 2, icon: ScanLine, label: "Bước 2 · Quét mã sản phẩm", placeholder: "QUÉT BARCODE...", value: scannedSku, setter: setScannedSku, onEnter: handleScanSku, done: stepIndex > 2 },
                ].map(({ key, icon: Icon, label, placeholder, value, setter, onEnter, done }) => (
                    <div key={key} className={cn(
                        "overflow-hidden rounded-2xl border transition-all duration-300",
                        currentStep === key ? "border-indigo-200 bg-white shadow-lg shadow-indigo-100/50 dark:border-indigo-800 dark:bg-slate-900" : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950"
                    )}>
                        <div className="flex items-center gap-3 p-4">
                            <div className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
                                currentStep === key ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300"
                            )}>
                                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                                <p className={cn("text-[10px] font-black uppercase tracking-widest", currentStep === key ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400")}>
                                    {label}
                                </p>
                                <Input
                                    placeholder={placeholder}
                                    className="mt-0.5 h-8 border-none bg-transparent p-0 text-base font-black uppercase placeholder:text-slate-300 focus-visible:ring-0 shadow-none"
                                    value={value}
                                    disabled={currentStep !== key}
                                    onChange={(e) => setter(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && onEnter()}
                                />
                            </div>
                        </div>

                        {/* Camera scanner — embedded in active step */}
                        {currentStep === key && (
                            <div className="px-4 pb-4">
                                <div className="overflow-hidden rounded-xl border-2 border-dashed border-indigo-100 bg-slate-50 min-h-[160px] dark:border-indigo-900 dark:bg-slate-950">
                                    <BarcodeScanner
                                        onScanSuccess={(text) => onEnter(text)}
                                        onScanError={(err) => { if (err.includes("permission")) toast.error("Cần cấp quyền Camera để quét!"); }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Step 3: Qty */}
                <div className={cn(
                    "overflow-hidden rounded-2xl border transition-all duration-300",
                    currentStep === "qty" ? "border-indigo-200 bg-white shadow-lg shadow-indigo-100/50 dark:border-indigo-800 dark:bg-slate-900" : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950"
                )}>
                    <div className="flex items-center gap-3 p-4">
                        <div className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
                            currentStep === "qty" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-300"
                        )}>
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-[10px] font-black uppercase tracking-widest", currentStep === "qty" ? "text-indigo-600" : "text-slate-400")}>
                                Bước 3 · Xác nhận số lượng
                            </p>
                            <Input
                                type="number"
                                className="mt-0.5 h-8 border-none bg-transparent p-0 text-base font-black focus-visible:ring-0 shadow-none"
                                value={pickedQty}
                                onChange={(e) => setPickedQty(e.target.value)}
                                disabled={currentStep !== "qty"}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
                <Button
                    variant="outline"
                    className="h-14 flex-1 rounded-2xl border-slate-200 text-xs font-black text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all active:scale-95"
                    onClick={() => setIsExceptionOpen(true)}
                >
                    BÁO LỖI
                </Button>
                <Button
                    className={cn(
                        "h-14 flex-[2.5] rounded-2xl text-sm font-black shadow-xl transition-all active:scale-95",
                        currentStep === "qty"
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    )}
                    disabled={currentStep !== "qty"}
                    onClick={handleConfirmPick}
                >
                    HOÀN TẤT LẤY HÀNG
                </Button>
            </div>

            {/* Exception dialog */}
            <Dialog open={isExceptionOpen} onOpenChange={setIsExceptionOpen}>
                <DialogContent className="max-w-[calc(100%-2.5rem)] rounded-3xl p-7 shadow-2xl border-none">
                    <DialogHeader className="space-y-4 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900">Báo lỗi ngoại lệ</DialogTitle>
                            <DialogDescription className="mt-1 text-xs text-slate-400">
                                Chọn lý do bạn không thể hoàn thành nhiệm vụ này.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="mt-4 flex flex-col gap-3">
                        {[
                            { label: "Hàng bị hỏng / lỗi", reason: "Hàng bị hỏng/Lỗi" },
                            { label: "Thiếu hàng / sai vị trí", reason: "Sai vị trí/Thiếu hàng" },
                        ].map(({ label, reason }) => (
                            <Button
                                key={reason}
                                variant="outline"
                                className="h-14 justify-between rounded-2xl px-5 text-xs font-black border-slate-100 hover:bg-slate-50 transition-all active:scale-[0.98]"
                                onClick={async () => {
                                    if (!activeItem) return;
                                    try {
                                        await reportException({ id: activeItem.id, soItemId: activeItem.soItemId, reason }).unwrap();
                                        setIsExceptionOpen(false);
                                        toast.warning(`Ghi nhận: ${label}`);
                                        setSelectedTaskId(null);
                                        resetState();
                                    } catch (err) { toast.error(taskScopeErrMessage(err)); }
                                }}
                            >
                                {label} <ChevronRight className="h-4 w-4 opacity-30" />
                            </Button>
                        ))}
                    </div>
                    <Button variant="ghost" className="mt-2 h-11 w-full rounded-xl text-sm font-bold text-slate-400 hover:text-slate-600" onClick={() => setIsExceptionOpen(false)}>
                        Hủy và quay lại
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
  }
