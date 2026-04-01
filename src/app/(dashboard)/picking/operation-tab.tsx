"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ScanBarcode, Maximize, AlertCircle, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    const pendingId = pagedData?.data?.content?.[0]?.id;
    
    const { data: detailData, isFetching: isDetailLoading } = useGetPickingItemByIdQuery(pendingId as string, { 
        skip: !pendingId 
    });
    
    const activeLine = detailData?.data;

    const [updatePickingItem] = useUpdatePickingItemMutation();

    const [currentStep, setCurrentStep] = useState<"location" | "sku" | "qty">("location");

    const [scannedLoc, setScannedLoc] = useState("");
    const [scannedSku, setScannedSku] = useState("");
    const [pickedQty, setPickedQty] = useState<string>("");

    const [isExceptionOpen, setIsExceptionOpen] = useState(false);

    const handleScanLocation = () => {
        if (!activeLine) return;
        const expectedLoc = activeLine.locationCode || activeLine.locationId;
        if (scannedLoc.toUpperCase() !== expectedLoc.toUpperCase()) {
            toast.error("Vị trí không khớp! Yêu cầu: " + expectedLoc);
            setScannedLoc("");
            return;
        }
        toast.success("Đúng vị trí!");
        setCurrentStep("sku");
    };

    const handleScanSku = () => {
        if (!activeLine) return;
        const expectedSku = activeLine.productSku || activeLine.productCode || activeLine.productId;
        if (scannedSku.toUpperCase() !== expectedSku.toUpperCase() && scannedSku.toUpperCase() !== activeLine.barcodeEan13?.toUpperCase()) {
            toast.error("Mã không khớp! Yêu cầu: " + expectedSku);
            setScannedSku("");
            return;
        }
        toast.success("Đúng sản phẩm!");
        setCurrentStep("qty");
    };

    const handleConfirmPick = async () => {
        if (!activeLine) return;
        if (Number(pickedQty) > activeLine.qtyToPick) {
            toast.error("Không thể vượt quá số lượng yêu cầu!");
            return;
        }
        if (Number(pickedQty) < activeLine.qtyToPick) {
            toast.error("Khác số lượng. Vui lòng Báo Lỗi để tạo Short Pick.");
            return;
        }
        
        try {
            await updatePickingItem({
                id: activeLine.id,
                soItemId: activeLine.soItemId,
                productId: activeLine.productId,
                locationId: activeLine.locationId,
                qtyToPick: activeLine.qtyToPick,
                qtyPicked: Number(pickedQty),
                status: "PICKED"
            }).unwrap();
            
            toast.success("Pick thành công dòng này! Tự động chuyển dòng tiếp theo...");
            setCurrentStep("location");
            setScannedLoc("");
            setScannedSku("");
            setPickedQty("");
            refetch(); // fetch next pending item
        } catch (error) {
            toast.error("Cập nhật thất bại. Vui lòng thử lại!");
        }
    };

    if (isLoading || isDetailLoading) {
        return <div className="text-center p-8 text-slate-500">Đang tải công việc chi tiết...</div>;
    }

    if (!activeLine) {
        return (
            <Card className="mx-auto max-w-sm border-emerald-100 shadow-md p-8 text-center text-emerald-600">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-bold text-lg">Bạn đã hoàn tất</h3>
                <p className="text-sm">Không còn đơn picking nào đang chờ</p>
                <Button onClick={() => refetch()} variant="outline" className="mt-4 w-full">Làm mới</Button>
            </Card>
        );
    }

    return (
        <div className="mx-auto max-w-sm space-y-4">
            <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-500">Đơn: {activeLine.salesOrderNumber || `#${activeLine.soItemId.slice(0, 8)}`}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">Line: {activeLine.id.slice(-6)}</span>
            </div>

            <Card className="border-indigo-100 shadow-md transition-all">
                <CardHeader className="bg-indigo-50/50 pb-4">
                    <CardTitle className="text-base leading-tight">
                        <span>{activeLine.productName || "Sản phẩm không tên"}</span>
                    </CardTitle>
                    <div className="flex gap-2 items-center flex-wrap mt-2">
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">SKU: {activeLine.productSku || activeLine.productCode || activeLine.productId}</span>
                        {activeLine.categoryName && <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded">{activeLine.categoryName}</span>}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center gap-4 rounded-lg bg-orange-50 p-3 outline outline-orange-200">
                        <MapPin className="h-8 w-8 text-orange-500" />
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-orange-900 leading-none mb-1">Vị trí (Zone: {activeLine.zone || "-"} | Aisle: {activeLine.aisle || "-"})</p>
                            <p className="text-lg font-bold text-orange-700">{activeLine.locationCode || activeLine.locationName || activeLine.locationId}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded bg-orange-100 px-3 py-1">
                            <span className="text-[10px] text-orange-600 font-bold uppercase">Lấy ({activeLine.baseUnit || "Qty"})</span>
                            <span className="text-xl font-black text-orange-900">{activeLine.qtyToPick}</span>
                        </div>
                    </div>
                    
                    {/* Tồn khả dụng */}
                    {(activeLine.qtyAvailable !== undefined && activeLine.qtyAvailable !== null) && (
                        <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 py-1 px-3 rounded text-center">
                            Tồn kho tại vị trí này: {activeLine.qtyAvailable} {activeLine.baseUnit} 
                            {activeLine.lotNumber && ` (Lô: ${activeLine.lotNumber})`}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Bước 1: Location */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold flex justify-between">
                                <span>1. Quét Vị Trí (Location)</span>
                                {currentStep !== "location" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Quét mã vạch vị trí..."
                                    className={currentStep === "location" ? "border-indigo-500 ring-2 ring-indigo-100 uppercase" : "uppercase"}
                                    value={scannedLoc}
                                    disabled={currentStep !== "location"}
                                    onChange={(e) => setScannedLoc(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleScanLocation()}
                                />
                                {currentStep === "location" && (
                                    <Button onClick={handleScanLocation} variant="default" size="icon" className="shrink-0 bg-indigo-600"><ArrowRight className="h-4 w-4" /></Button>
                                )}
                            </div>
                        </div>

                        {/* Bước 2: SKU */}
                        <div className={`space-y-1 transition-opacity ${currentStep === "location" ? "opacity-40" : "opacity-100"}`}>
                            <Label className="text-xs font-semibold flex justify-between">
                                <span>2. Quét Sản Phẩm (SKU)</span>
                                {currentStep === "qty" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Quét barcode sản phẩm..."
                                    value={scannedSku}
                                    onChange={(e) => setScannedSku(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleScanSku()}
                                    disabled={currentStep === "location" || currentStep === "qty"}
                                    className={currentStep === "sku" ? "border-indigo-500 ring-2 ring-indigo-100 uppercase" : "uppercase"}
                                />
                                {currentStep === "sku" && (
                                    <Button onClick={handleScanSku} variant="default" size="icon" className="shrink-0 bg-indigo-600"><ArrowRight className="h-4 w-4" /></Button>
                                )}
                            </div>
                        </div>

                        {/* Bước 3: Số lượng */}
                        {currentStep === "qty" && (
                            <div className={`space-y-1 transition-opacity`}>
                                <Label className="text-xs font-semibold text-emerald-600">
                                    3. Xác nhận số lượng
                                </Label>
                                <Input
                                    type="number"
                                    value={pickedQty}
                                    onChange={(e) => setPickedQty(e.target.value)}
                                    className="border-emerald-500 ring-2 ring-emerald-100 text-lg font-bold"
                                />
                            </div>
                        )}
                    </div>

                </CardContent>
                <CardFooter className="flex gap-2 pt-2 border-t bg-slate-50 rounded-b-xl border-dashed">
                    <Button variant="outline" className="flex-1 text-rose-600 border-rose-200 bg-white" size="lg" onClick={() => setIsExceptionOpen(true)}>Báo lỗi</Button>
                    <Button
                        className="flex-2 bg-indigo-600 hover:bg-indigo-700"
                        size="lg"
                        disabled={currentStep !== "qty"}
                        onClick={handleConfirmPick}
                    >
                        Xác nhận Pick
                    </Button>
                </CardFooter>
            </Card>
            {/* Exception Dialog */}
            <Dialog open={isExceptionOpen} onOpenChange={setIsExceptionOpen}>
                <DialogContent className="max-w-sm rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Báo cáo ngoại lệ</DialogTitle>
                        <DialogDescription>
                            Hãy chọn lý do bạn không thể hoàn tất line này. Supervisor sẽ được thông báo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                        <Button variant="outline" className="justify-between" onClick={() => { setIsExceptionOpen(false); toast.success("Đã ghi nhận Hàng Hỏng!"); }}>
                            Hàng bị hỏng (Damaged) <ChevronRight className="h-4 w-4 opacity-50" />
                        </Button>
                        <Button variant="outline" className="justify-between" onClick={() => { setIsExceptionOpen(false); toast.success("Đã ghi nhận Lấy Thiếu!"); }}>
                            Lấy thiếu (Short Pick) <ChevronRight className="h-4 w-4 opacity-50" />
                        </Button>
                        <Button variant="outline" className="justify-between" onClick={() => { setIsExceptionOpen(false); toast.success("Đã ghi nhận Lỗi Vị Trí!"); }}>
                            Sai vị trí lưu kho <ChevronRight className="h-4 w-4 opacity-50" />
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button type="button" variant="secondary" className="w-full" onClick={() => setIsExceptionOpen(false)}>Hủy</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
