import { SearchToolbar } from "@/components/ui/search-toolbar";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
import { AdvancedFilterActions } from "@/components/features/AdvancedFilters";
import { ProductFiltersPanel } from "@/components/features/products/components/ProductFiltersPanel";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type { Category } from "@/types/category";
import type { Warehouse } from "@/types/warehouse";

type ProductsSearchSectionProps = {
    searchInput: string;
    onSearchChange: (value: string) => void;
    advancedOpen: boolean;
    onToggleAdvanced: () => void;
    advancedCount: number;
    hasAnyFilter: boolean;
    onClearFilters: () => void;
    statusFilter: "" | "ACTIVE" | "INACTIVE";
    categoryFilter: string;
    warehouseFilter: string;
    onStatusChange: (status: "" | "ACTIVE" | "INACTIVE" | null) => void;
    onCategoryChange: (categoryId: string | null) => void;
    onWarehouseChange: (warehouseId: string | null) => void;
    categoryOptionsData: ApiResponse<PagedResponse<Category>> | undefined;
    categoriesLoading: boolean;
    categoriesError: unknown;
    onRefetchCategories: () => void;
    warehouseOptionsData: ApiResponse<PagedResponse<Warehouse>> | undefined;
    warehousesLoading: boolean;
    warehousesError: unknown;
    onRefetchWarehouses: () => void;
    isFetching?: boolean;
    onRefresh: () => void;
    noContainer?: boolean;
};

export function ProductsSearchSection({
    searchInput,
    onSearchChange,
    advancedOpen,
    onToggleAdvanced,
    advancedCount,
    hasAnyFilter,
    onClearFilters,
    statusFilter,
    categoryFilter,
    warehouseFilter,
    onStatusChange,
    onCategoryChange,
    onWarehouseChange,
    categoryOptionsData,
    categoriesLoading,
    categoriesError,
    onRefetchCategories,
    warehouseOptionsData,
    warehousesLoading,
    warehousesError,
    onRefetchWarehouses,
    isFetching = false,
    onRefresh,
    noContainer = false,
}: ProductsSearchSectionProps) {
    const showFilters = advancedOpen || advancedCount > 0;

    return (
        <SearchToolbar
            noContainer={noContainer}
            placeholder="Tìm kiếm sản phẩm"
            value={searchInput}
            onValueChange={onSearchChange}
            right={
                <>
                    <TableRefreshButton isFetching={isFetching} onRefresh={onRefresh} />
                    <AdvancedFilterActions
                        open={advancedOpen}
                        onToggle={onToggleAdvanced}
                        activeCount={advancedCount}
                        hasAnyFilter={hasAnyFilter}
                        onClear={onClearFilters}
                    />
                </>
            }
            filters={
                showFilters ? (
                    <ProductFiltersPanel
                        open={advancedOpen}
                        statusFilter={statusFilter}
                        categoryFilter={categoryFilter}
                        warehouseFilter={warehouseFilter}
                        advancedCount={advancedCount}
                        onStatusChange={onStatusChange}
                        onCategoryChange={onCategoryChange}
                        onWarehouseChange={onWarehouseChange}
                        categoryOptionsData={categoryOptionsData}
                        categoriesLoading={categoriesLoading}
                        categoriesError={categoriesError}
                        onRefetchCategories={onRefetchCategories}
                        warehouseOptionsData={warehouseOptionsData}
                        warehousesLoading={warehousesLoading}
                        warehousesError={warehousesError}
                        onRefetchWarehouses={onRefetchWarehouses}
                    />
                ) : null
            }
        />
    );
}
