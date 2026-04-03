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

                        <div className="space-y-1.5">
                            <Label>Mã vị trí</Label>
                            <Input
                                value={formState.code}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        code: e.target.value,
                                    }))
                                }
                                placeholder="VD: Z1-A01-R02"
                            />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>Tên vị trí</Label>
                            <Input
                                value={formState.name}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="VD: Kệ hàng nhanh"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Zone</Label>
                            <Input
                                value={formState.zone}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        zone: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Aisle</Label>
                            <Input
                                value={formState.aisle}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        aisle: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Rack</Label>
                            <Input
                                value={formState.rack}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        rack: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Bin</Label>
                            <Input
                                value={formState.bin}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        bin: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Level</Label>
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

                        <div className="space-y-1.5 sm:col-span-2">
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
