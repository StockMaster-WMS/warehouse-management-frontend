"use client";

import { useMemo, useState } from "react";
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
    { value: "STO", label: "Lưu trữ" },
    { value: "PICK", label: "Lấy hàng" },
    { value: "RCV", label: "Nhận hàng" },
    { value: "QC", label: "Kiểm định" },
    { value: "RET", label: "Hàng trả" },
    { value: "COLD", label: "Đông lạnh" },
    { value: "HEAVY", label: "Hàng nặng" },
    { value: "HAZ", label: "Hàng nguy hiểm" },
];

function sanitizeCodeSegment(value: string, fallback: string) {
    const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return cleaned || fallback;
}

function inferLocationPrefix(warehouse?: Warehouse) {
    const code = warehouse?.code?.trim().toUpperCase() || "";
    const parts = code.split("-").filter(Boolean);
    const normalizedParts = parts[0] === "WH" ? parts.slice(1) : parts;

    return {
        warehouseCodePrefix: sanitizeCodeSegment(normalizedParts[0] || "", "WH"),
        areaCode: sanitizeCodeSegment(normalizedParts[1] || "", "TT"),
    };
}

export function BulkLocationDialog({ open, onOpenChange, warehouses, onSuccess }: BulkLocationDialogProps) {
    const [bulkGenerate] = useBulkGenerateLocationsMutation();
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        warehouseId: "",
        warehouseCodePrefix: "",
        areaCode: "TT",
        zone: "STO",
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

    const totalCalculated = form.aisleCount * form.rackCount * form.levelCount * form.binCount;
    const previewCodes = useMemo(() => {
        const codes: string[] = [];
        const maxPreview = 36;

        for (let aisle = form.aisleStart; aisle < form.aisleStart + form.aisleCount; aisle += 1) {
            for (let rack = form.rackStart; rack < form.rackStart + form.rackCount; rack += 1) {
                for (let level = form.levelStart; level < form.levelStart + form.levelCount; level += 1) {
                    for (let bin = form.binStart; bin < form.binStart + form.binCount; bin += 1) {
                        codes.push(
                            [
                                form.warehouseCodePrefix,
                                form.areaCode,
                                form.zone,
                                `${form.aislePrefix}${String(aisle).padStart(2, "0")}`,
                                `${form.rackPrefix}${String(rack).padStart(2, "0")}`,
                                `L${String(level).padStart(2, "0")}`,
                                `${form.binPrefix}${String(bin).padStart(2, "0")}`,
                            ].filter(Boolean).join("-"),
                        );
                        if (codes.length >= maxPreview) return codes;
                    }
                }
            }
        }

        return codes;
    }, [form]);

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
            warehouseCodePrefix: sanitizeCodeSegment(form.warehouseCodePrefix, "WH"),
            areaCode: sanitizeCodeSegment(form.areaCode, "TT"),
            zone: sanitizeCodeSegment(form.zone, "STO"),
            aislePrefix: sanitizeCodeSegment(form.aislePrefix, "A"),
            aisleStart: form.aisleStart,
            aisleCount: form.aisleCount,
            rackPrefix: sanitizeCodeSegment(form.rackPrefix, "R"),
            rackStart: form.rackStart,
            rackCount: form.rackCount,
            levelStart: form.levelStart,
            levelCount: form.levelCount,
            binPrefix: sanitizeCodeSegment(form.binPrefix, "B"),
            binStart: form.binStart,
            binCount: form.binCount,
            locationType: form.zone === "PICK" ? "PICKING" : "STORAGE",
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
                            <Wand2 className="size-5" />
                            <DialogTitle className="text-lg font-bold">Tạo nhiều vị trí</DialogTitle>
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
                                    onValueChange={(v) => {
                                        const warehouseId = v ?? "";
                                        const inferred = inferLocationPrefix(warehouses.find(w => w.id === warehouseId));
                                        setForm(f => ({ ...f, warehouseId, ...inferred }));
                                    }}
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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 uppercase">Mã kho trong vị trí *</Label>
                                    <Input
                                        placeholder="VD: HCM, HN"
                                        className="h-10 rounded-sm border-slate-200 bg-white font-mono text-sm uppercase"
                                        value={form.warehouseCodePrefix}
                                        onChange={e => setForm(f => ({ ...f, warehouseCodePrefix: e.target.value.toUpperCase() }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 uppercase">Khu/Area *</Label>
                                    <Input
                                        placeholder="VD: TT, BB"
                                        className="h-10 rounded-sm border-slate-200 bg-white font-mono text-sm uppercase"
                                        value={form.areaCode}
                                        onChange={e => setForm(f => ({ ...f, areaCode: e.target.value.toUpperCase() }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 uppercase">Zone</Label>
                                <Select
                                    value={form.zone}
                                    onValueChange={(v) => setForm(f => ({ ...f, zone: v ?? "STO" }))}
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
                                    <span className="text-[9px] text-slate-400 font-medium">Bắt đầu</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200" value={form.aisleStart} onChange={e => setForm(f => ({ ...f, aisleStart: Number(e.target.value) }))} />
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
                                    <span className="text-[9px] text-slate-400 font-medium">Bắt đầu</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200" value={form.rackStart} onChange={e => setForm(f => ({ ...f, rackStart: Number(e.target.value) }))} />
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
                                    <span className="text-[9px] text-slate-400 font-medium">Bắt đầu</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200" value={form.levelStart} onChange={e => setForm(f => ({ ...f, levelStart: Number(e.target.value) }))} />
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
                                    <span className="text-[9px] text-slate-400 font-medium">Bắt đầu</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200" value={form.binStart} onChange={e => setForm(f => ({ ...f, binStart: Number(e.target.value) }))} />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-indigo-600 font-bold uppercase">Số lượng</span>
                                    <Input type="number" min={1} className="h-9 text-sm rounded-sm border-slate-200 font-bold" value={form.binCount} onChange={e => setForm(f => ({ ...f, binCount: Number(e.target.value) }))} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                Preview mã vị trí
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Sẽ tạo {totalCalculated.toLocaleString("vi-VN")} vị trí. Hiển thị trước {previewCodes.length.toLocaleString("vi-VN")} mã đầu tiên.
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 grid max-h-40 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                        {previewCodes.length > 0 ? (
                            previewCodes.map((code) => (
                                <span
                                    key={code}
                                    className="rounded border border-white/70 bg-white/80 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
                                >
                                    {code}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-500">Nhập dải vị trí để xem preview.</span>
                        )}
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
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Đang tạo…
                            </>
                        ) : (
                            <>
                                Tạo nhiều vị trí
                            </> 
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
