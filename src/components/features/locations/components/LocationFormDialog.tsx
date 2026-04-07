import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UNSELECTED_WAREHOUSE, type LocationFormState } from "@/components/features/locations/constants";
import type { LocationOption } from "@/types/purchase-order";

type WarehouseOption = {
    id: string;
    name: string;
};

type LocationFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingLocation: LocationOption | null;
    isSubmitting: boolean;
    formState: LocationFormState;
    setFormState: (updater: (prev: LocationFormState) => LocationFormState) => void;
    formWarehouseSelectValue: string;
    formWarehouseLabel: string;
    warehouses: WarehouseOption[];
    onSubmit: () => Promise<boolean>;
};

export function LocationFormDialog({
    open,
    onOpenChange,
    editingLocation,
    isSubmitting,
    formState,
    setFormState,
    formWarehouseSelectValue,
    formWarehouseLabel,
    warehouses,
    onSubmit,
}: LocationFormDialogProps) {
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await onSubmit();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl" showCloseButton={!isSubmitting}>
                <DialogHeader>
                    <DialogTitle>{editingLocation ? "Sửa vị trí" : "Thêm vị trí mới"}</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin vị trí lưu trữ để đồng bộ dữ liệu kho.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-3" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Kho</Label>
                            <Select
                                value={formWarehouseSelectValue}
                                onValueChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        warehouseId: !value || value === UNSELECTED_WAREHOUSE ? "" : value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn kho">{formWarehouseLabel}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UNSELECTED_WAREHOUSE}>Chọn kho</SelectItem>
                                    {warehouses.map((warehouse) => (
                                        <SelectItem key={warehouse.id} value={warehouse.id}>
                                            {warehouse.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {editingLocation && (
                            <div className="space-y-1.5">
                                <Label>Mã vị trí</Label>
                                <Input
                                    value={formState.code}
                                    disabled
                                    className="bg-slate-50 font-mono text-slate-500 font-bold dark:bg-slate-800 dark:text-slate-400 border-slate-200"
                                    placeholder="Được tạo tự động bởi hệ thống"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Khu vực (Zone)</Label>
                            <Input
                                value={formState.zone}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        zone: e.target.value,
                                    }))
                                }
                                placeholder="VD: A"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Dãy (Aisle)</Label>
                            <Input
                                value={formState.aisle}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        aisle: e.target.value,
                                    }))
                                }
                                placeholder="VD: 01"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Kệ (Rack)</Label>
                            <Input
                                value={formState.rack}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        rack: e.target.value,
                                    }))
                                }
                                placeholder="VD: R1"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tầng (Level)</Label>
                            <Input
                                type="number"
                                value={formState.level}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        level: e.target.value,
                                    }))
                                }
                                placeholder="VD: 1"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Ngăn (Bin)</Label>
                            <Input
                                value={formState.bin}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        bin: e.target.value,
                                    }))
                                }
                                placeholder="VD: B2"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Loại vị trí</Label>
                            <Input
                                value={formState.locationType}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        locationType: e.target.value,
                                    }))
                                }
                                placeholder="VD: PICKING"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Trạng thái</Label>
                            <Select
                                value={formState.isActive ? "active" : "inactive"}
                                onValueChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        isActive: value !== "inactive",
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Đang dùng</SelectItem>
                                    <SelectItem value="inactive">Ngừng dùng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : editingLocation ? (
                                "Lưu thay đổi"
                            ) : (
                                "Tạo vị trí"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
