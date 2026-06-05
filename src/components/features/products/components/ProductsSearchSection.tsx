import { SearchToolbar } from "@/components/ui/search-toolbar";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
import { AdvancedFilterActions } from "@/components/features/AdvancedFilters";
import { ProductFiltersPanel } from "@/components/features/products/components/ProductFiltersPanel";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type { Category } from "@/types/category";
import type { Warehouse } from "@/types/warehouse";
import type { Supplier } from "@/types/supplier";

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
    supplierFilter: string;
    onStatusChange: (status: "" | "ACTIVE" | "INACTIVE" | null) => void;
    onCategoryChange: (categoryId: string | null) => void;
    onWarehouseChange: (warehouseId: string | null) => void;
    onSupplierChange: (supplierId: string | null) => void;
    categoryOptionsData: ApiResponse<PagedResponse<Category>> | undefined;
    categoriesLoading: boolean;
    categoriesError: unknown;
    onRefetchCategories: () => void;
    warehouseOptionsData: ApiResponse<PagedResponse<Warehouse>> | undefined;
    warehousesLoading: boolean;
    warehousesError: unknown;
    onRefetchWarehouses: () => void;
    supplierOptionsData: ApiResponse<PagedResponse<Supplier>> | undefined;
    suppliersLoading: boolean;
    suppliersError: unknown;
    onRefetchSuppliers: () => void;
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
    supplierFilter,
    onStatusChange,
    onCategoryChange,
    onWarehouseChange,
    onSupplierChange,
    categoryOptionsData,
    categoriesLoading,
    categoriesError,
    onRefetchCategories,
    warehouseOptionsData,
    warehousesLoading,
    warehousesError,
    onRefetchWarehouses,
    supplierOptionsData,
    suppliersLoading,
    suppliersError,
    onRefetchSuppliers,
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
                        supplierFilter={supplierFilter}
                        advancedCount={advancedCount}
                        onStatusChange={onStatusChange}
                        onCategoryChange={onCategoryChange}
                        onWarehouseChange={onWarehouseChange}
                        onSupplierChange={onSupplierChange}
                        categoryOptionsData={categoryOptionsData}
                        categoriesLoading={categoriesLoading}
                        categoriesError={categoriesError}
                        onRefetchCategories={onRefetchCategories}
                        warehouseOptionsData={warehouseOptionsData}
                        warehousesLoading={warehousesLoading}
                        warehousesError={warehousesError}
                        onRefetchWarehouses={onRefetchWarehouses}
                        supplierOptionsData={supplierOptionsData}
                        suppliersLoading={suppliersLoading}
                        suppliersError={suppliersError}
                        onRefetchSuppliers={onRefetchSuppliers}
                    />
                ) : null
            }
        />
    );
}
