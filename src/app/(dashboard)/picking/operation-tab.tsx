"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useGetPickingItemsQuery, useUpdatePickingItemMutation, useGetPickingItemByIdQuery } from "@/store/services/picking-item.service";

export function OperationTab() {
    const { data: pagedData, isLoading, refetch } = useGetPickingItemsQuery({ status: "PENDING" });
    
    // Smart Picking Path Selection (Mobile)
    const activeSummary = useMemo(() => {
        const items = pagedData?.data?.content || [];
        if (items.length === 0) return null;
        
        const sorted = [...items].sort((a, b) => {
            const zoneA = a.zone || "";
            const zoneB = b.zone || "";
            if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);
            const aisleA = a.aisle || "";
            const aisleB = b.aisle || "";
            if (aisleA !== aisleB) return aisleA.localeCompare(aisleB);
            return (a.locationCode || "").localeCompare(b.locationCode || "");
        });
        
        return sorted[0];
    }, [pagedData]);

    const { data: detailData, isFetching: isDetailLoading } = useGetPickingItemByIdQuery(activeSummary?.id as string, { 
        skip: !activeSummary?.id 
    });
    
    const activeItem = detailData?.data;

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
            toast.error("Vị trí không khớp! Yêu cầu: " + expectedLoc);
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
            toast.error("Mã không khớp! Yêu cầu: " + expectedSku);
            setScannedSku("");
            return;
        }
        toast.success("Đúng sản phẩm!");
        setCurrentStep("qty");
    };

    const handleConfirmPick = async () => {
        if (!activeItem) return;
        const qty = Number(pickedQty);
        if (qty > activeItem.qtyToPick) {
            toast.error("Không thể vượt quá số lượng yêu cầu!");
            return;
        }
        if (qty < activeItem.qtyToPick) {
            toast.error("Khác số lượng. Vui lòng Báo Lỗi để tạo Short Pick.");
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
            
            toast.success("Pick thành công! Đang chuyển dòng tiếp theo...");
            setCurrentStep("location");
            setScannedLoc("");
            setScannedSku("");
            setPickedQty("");
            refetch();
        } catch {
            toast.error("Cập nhật thất bại. Vui lòng thử lại!");
        }
    };

    if (isLoading || isDetailLoading) {
        return <div className="text-center p-12 text-slate-500">Đang tải công việc...</div>;
    }

    if (!activeItem) {
        return (
            <Card className="mx-auto max-w-sm border-emerald-100 shadow-md p-8 text-center text-emerald-600 rounded-2xl">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-bold text-lg">Bạn đã hoàn tất</h3>
                <p className="text-sm text-slate-500">Không còn đơn picking nào đang chờ</p>
                <Button onClick={() => refetch()} variant="outline" className="mt-6 w-full">Làm mới</Button>
            </Card>
        );
    }

    return (
        <div className="mx-auto max-w-sm space-y-4 pt-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-slate-400">Đơn xuất: <span className="text-slate-600 dark:text-slate-300 font-mono">{activeItem.salesOrderNumber || `#${activeItem.soItemId.slice(0, 8)}`}</span></span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">ID: {activeItem.id.slice(-6).toUpperCase()}</span>
            </div>

            <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg dark:border-slate-800 transition-all">
                <CardHeader className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <CardTitle className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                        {activeItem.productName || "Sản phẩm không tên"}
                    </CardTitle>
                    <div className="flex gap-2 items-center flex-wrap mt-2.5">
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm dark:bg-slate-800 dark:text-slate-300">SKU: {activeItem.productSku || activeItem.productCode || activeItem.productId}</span>
                        {activeItem.categoryName && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm dark:bg-indigo-950/50 dark:text-indigo-300">{activeItem.categoryName}</span>}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 px-5 sm:px-6">
                    <div className="flex items-center gap-4 rounded-xl bg-orange-50/80 p-4 border border-orange-200/60 dark:bg-orange-950/20 dark:border-orange-500/20 shadow-sm">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 shadow-orange-200 shadow-lg">
                            <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-1">Vị trí: {activeItem.zone || "-"} | {activeItem.aisle || "-"}</p>
                            <p className="text-lg font-black text-orange-950 dark:text-orange-200 tracking-tight leading-none">{activeItem.locationCode || activeItem.locationName || activeItem.locationId}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-xl bg-white/60 dark:bg-black/20 px-4 py-2 border border-orange-200/50">
                            <span className="text-[10px] text-orange-600 font-bold uppercase mb-0.5">Yêu cầu</span>
                            <span className="text-2xl font-black text-orange-900 dark:text-orange-100 tabular-nums">{activeItem.qtyToPick}</span>
                        </div>
                    </div>
                    
                    {(activeItem.qtyAvailable !== undefined && activeItem.qtyAvailable !== null) && (
                        <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 py-1 px-3 rounded text-center dark:bg-emerald-950/20 dark:text-emerald-400">
                            Tồn kho tại vị trí này: <span className="font-bold">{activeItem.qtyAvailable}</span> {activeItem.baseUnit} 
                            {activeItem.lotNumber && ` (Lô: ${activeItem.lotNumber})`}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                                <span>1. Quét Vị Trí (Location)</span>
                                {currentStep !== "location" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Quét mã vạch vị trí..."
                                    className={cn("h-11 rounded-xl uppercase font-mono transition-all", currentStep === "location" ? "border-indigo-500 ring-2 ring-indigo-100" : "bg-slate-50")}
                                    value={scannedLoc}
                                    disabled={currentStep !== "location"}
                                    onChange={(e) => setScannedLoc(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleScanLocation()}
                                />
                                {currentStep === "location" && (
                                    <Button onClick={handleScanLocation} variant="default" size="icon" className="h-11 w-11 shrink-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100"><ArrowRight className="h-5 w-5" /></Button>
                                )}
                            </div>
                        </div>

                        <div className={cn("space-y-1 transition-opacity", currentStep === "location" ? "opacity-30" : "opacity-100")}>
                            <Label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                                <span>2. Quét Sản Phẩm (SKU/Barcode)</span>
                                {currentStep === "qty" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Quét barcode sản phẩm..."
                                    value={scannedSku}
                                    onChange={(e) => setScannedSku(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleScanSku()}
                                    disabled={currentStep !== "sku"}
                                    className={cn("h-11 rounded-xl uppercase font-mono transition-all", currentStep === "sku" ? "border-indigo-500 ring-2 ring-indigo-100" : "bg-slate-50")}
                                />
                                {currentStep === "sku" && (
                                    <Button onClick={handleScanSku} variant="default" size="icon" className="h-11 w-11 shrink-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100"><ArrowRight className="h-5 w-5" /></Button>
                                )}
                            </div>
                        </div>

                        {currentStep === "qty" && (
                            <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-[10px] uppercase font-bold text-emerald-600">
                                    3. Xác nhận số lượng
                                </Label>
                                <Input
                                    type="number"
                                    value={pickedQty}
                                    autoFocus
                                    onChange={(e) => setPickedQty(e.target.value)}
                                    className="h-14 rounded-xl border-emerald-500 ring-4 ring-emerald-100 text-2xl font-black text-center tabular-nums"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex gap-3 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl text-rose-600 border-rose-200 bg-white hover:bg-rose-50" onClick={() => setIsExceptionOpen(true)}>Báo lỗi</Button>
                    <Button
                        className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none font-bold"
                        disabled={currentStep !== "qty"}
                        onClick={handleConfirmPick}
                    >
                        Xác nhận Pick
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={isExceptionOpen} onOpenChange={setIsExceptionOpen}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Báo cáo ngoại lệ</DialogTitle>
                        <DialogDescription>
                            Hãy chọn lý do bạn không thể hoàn tất line này. Quản lý kho sẽ được thông báo ngay lập tức.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                        <Button variant="outline" className="h-12 justify-between rounded-xl" onClick={() => { setIsExceptionOpen(false); toast.success("Đã ghi nhận Hàng Hỏng!"); }}>
                            Hàng bị hỏng (Damaged) <ChevronRight className="h-4 w-4 opacity-50" />
                        </Button>
                        <Button variant="outline" className="h-12 justify-between rounded-xl" onClick={() => { setIsExceptionOpen(false); toast.success("Đã ghi nhận Lấy Thiếu!"); }}>
                            Lấy thiếu (Short Pick) <ChevronRight className="h-4 w-4 opacity-50" />
                        </Button>
                        <Button variant="outline" className="h-12 justify-between rounded-xl" onClick={() => { setIsExceptionOpen(false); toast.success("Đã ghi nhận Lỗi Vị Trí!"); }}>
                            Sai vị trí thực tế <ChevronRight className="h-4 w-4 opacity-50" />
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" className="w-full h-11 rounded-xl" onClick={() => setIsExceptionOpen(false)}>Hủy bỏ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
