"use client";

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import { useBulkGenerateLocationsMutation } from "@/store/services/location.service";
import { toast } from "sonner";
import { Warehouse } from "@/types/warehouse";

interface BulkLocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    warehouses: Warehouse[];
    onSuccess?: () => void;
}

const ZONE_OPTIONS = [
    { value: "COLD", label: "Đông lạnh" },
    { value: "HEAVY", label: "Hàng nặng" },
    { value: "BULK", label: "Hàng rời" },
    { value: "FAST", label: "Luân chuyển nhanh" },
    { value: "HAZMAT", label: "Hàng nguy hiểm" },
    { value: "MAIN", label: "Vùng chính" },
];

export function BulkLocationDialog({ open, onOpenChange, warehouses, onSuccess }: BulkLocationDialogProps) {
    const [bulkGenerate] = useBulkGenerateLocationsMutation();
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        warehouseId: "",
        zone: "MAIN",
        aislePrefix: "A",
        aisleStart: 1,
        aisleCount: 1,
        rackPrefix: "R",
        rackStart: 1,
        rackCount: 1,
        levelStart: 1,
        levelCount: 1,
        binPrefix: "B",
        binStart: 1,
        binCount: 1,
    });

    const totalCalculated = useMemo(() => {
        return form.aisleCount * form.rackCount * form.levelCount * form.binCount;
    }, [form.aisleCount, form.rackCount, form.levelCount, form.binCount]);

    const handleGenerate = async () => {
        if (!form.warehouseId) {
            toast.error("Vui lòng chọn kho hàng");
            return;
        }

        if (totalCalculated <= 0) {
            toast.error("Vui lòng nhập các dải vị trí hợp lệ");
            return;
        }

        const payload = {
            warehouseId: form.warehouseId,
            zone: form.zone,
            aislePrefix: form.aislePrefix,
            aisleCount: form.aisleCount,
            rackPrefix: form.rackPrefix,
            rackCount: form.rackCount,
            levelCount: form.levelCount,
            binPrefix: form.binPrefix,
            binCount: form.binCount,
        };

        setIsLoading(true);
        try {
            await bulkGenerate(payload).unwrap();
            toast.success(`Đã tạo ${totalCalculated} vị trí thành công!`);
            onOpenChange(false);
            onSuccess?.();
        } catch {
            toast.error("Không thể tạo hàng loạt. Vui lòng kiểm tra lại cấu hình.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl overflow-y-auto max-h-[90vh] rounded-lg border border-slate-200 shadow-xl p-6">
                <DialogHeader className="space-y-1">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Wand2 className="h-5 w-5" />
                            <DialogTitle className="text-lg font-bold">Tạo vị trí hàng loạt</DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                    {/* General Config */}
                    <div className="md:col-span-3 space-y-4 p-4 rounded-md border border-slate-100 bg-slate-50/30">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 uppercase">Kho hàng *</Label>
                                <Select
                                    value={form.warehouseId}
                                    onValueChange={(v) => setForm(f => ({ ...f, warehouseId: v ?? "" }))}
                                >
                                    <SelectTrigger className="h-10 rounded-sm border-slate-200 bg-white">
                                        <SelectValue>
                                            {form.warehouseId 
                                                ? warehouses.find(w => w.id === form.warehouseId)?.name 
                                                : "Chọn kho"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 uppercase">Vùng (Zone)</Label>
                                <Select
                                    value={form.zone}
                                    onValueChange={(v) => setForm(f => ({ ...f, zone: v ?? "MAIN" }))}
                                >
                                    <SelectTrigger className="h-10 rounded-sm border-slate-200 bg-white">
                                        <SelectValue>
                                            {ZONE_OPTIONS.find(opt => opt.value === form.zone)?.label || "Chọn vùng"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ZONE_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    {/* Detailed Ranges */}
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                        {/* Aisle */}
                        <div className="space-y-2 p-3 rounded-md border border-slate-100 bg-white shadow-sm">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dãy (Aisle)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-medium">Tiền tố </span>
                                    <Input placeholder="VD: A" className="h-9 text-sm rounded-sm border-slate-200" value={form.aislePrefix} onChange={e => setForm(f => ({ ...f, aislePrefix: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-indigo-600 font-bold uppercase">Số lượng</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200 font-bold" value={form.aisleCount} onChange={e => setForm(f => ({ ...f, aisleCount: Number(e.target.value) }))} />
                                </div>
                            </div>
                        </div>

                        {/* Rack */}
                        <div className="space-y-2 p-3 rounded-md border border-slate-100 bg-white shadow-sm">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kệ (Rack)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-medium">Tiền tố </span>
                                    <Input placeholder="VD: R" className="h-9 text-sm rounded-sm border-slate-200" value={form.rackPrefix} onChange={e => setForm(f => ({ ...f, rackPrefix: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-indigo-600 font-bold uppercase">Số lượng</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200 font-bold" value={form.rackCount} onChange={e => setForm(f => ({ ...f, rackCount: Number(e.target.value) }))} />
                                </div>
                            </div>
                        </div>

                        {/* Level */}
                        <div className="space-y-2 p-3 rounded-md border border-slate-100 bg-white shadow-sm">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tầng (Level)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-medium">Ký tự trước</span>
                                    <div className="h-9 flex items-center bg-slate-50 px-3 text-[10px] text-slate-400 font-medium rounded-sm border border-slate-100 italic">Số thuần túy</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-indigo-600 font-bold uppercase">Số lượng</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200 font-bold" value={form.levelCount} onChange={e => setForm(f => ({ ...f, levelCount: Number(e.target.value) }))} />
                                </div>
                            </div>
                        </div>

                        {/* Bin */}
                        <div className="space-y-2 p-3 rounded-md border border-slate-100 bg-white shadow-sm">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ô (Bin)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-medium">Tiền tố</span>
                                    <Input placeholder="VD: B" className="h-9 text-sm rounded-sm border-slate-200" value={form.binPrefix} onChange={e => setForm(f => ({ ...f, binPrefix: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-indigo-600 font-bold uppercase">Số lượng</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200 font-bold" value={form.binCount} onChange={e => setForm(f => ({ ...f, binCount: Number(e.target.value) }))} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-2 pt-4 border-t border-slate-100 gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        className="rounded-sm font-medium text-slate-500"
                        onClick={() => onOpenChange(false)}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        size="sm"
                        disabled={isLoading || totalCalculated === 0}
                        onClick={handleGenerate}
                        className="rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                Tạo {totalCalculated.toLocaleString()} vị trí
                            </> 
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
