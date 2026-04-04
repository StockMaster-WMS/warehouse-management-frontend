import { SearchToolbar } from "@/components/ui/search-toolbar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ALL_WAREHOUSES } from "@/components/features/locations/constants";

type WarehouseOption = {
    id: string;
    name: string;
};

type LocationsFiltersProps = {
    searchInput: string;
    onSearchChange: (value: string) => void;
    warehouseFilter: string;
    onWarehouseFilterChange: (value: string) => void;
    selectedWarehouseLabel: string;
    isWarehousesLoading: boolean;
    warehouses: WarehouseOption[];
};

export function LocationsFilters({
    searchInput,
    onSearchChange,
    warehouseFilter,
    onWarehouseFilterChange,
    selectedWarehouseLabel,
    isWarehousesLoading,
    warehouses,
}: LocationsFiltersProps) {
    return (
        <SearchToolbar
            placeholder="Tìm theo mã vị trí, zone, aisle, rack, bin..."
            value={searchInput}
            onValueChange={onSearchChange}
            right={
                <div className="w-full sm:w-70">
                    <Select
                        value={warehouseFilter}
                        onValueChange={(value) => onWarehouseFilterChange(value ?? ALL_WAREHOUSES)}
                    >
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                            <SelectValue
                                placeholder={
                                    isWarehousesLoading ? "Đang tải danh sách kho..." : "Lọc theo kho"
                                }
                            >
                                {selectedWarehouseLabel}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_WAREHOUSES}>Tất cả kho</SelectItem>
                            {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            }
        />
    );
}
