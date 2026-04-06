"use client";

import { Layers3, Plus, SearchX } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import {
    LocationFormDialog,
    LocationsFilters,
    LocationsStats,
    LocationsTable,
    useLocationsPageLogic,
} from "@/components/features/locations";
import { apiErrMessage } from "@/types/api";

export default function LocationsPage() {
    const {
        searchInput,
        setSearchInput,
        warehouseFilter,
        setWarehouseFilter,
        warehouses,
        warehousesError,
        isWarehousesLoading,
        selectedWarehouseLabel,

        locationsError,
        isLocationsLoading,
        isLocationsFetching,
        refetchLocations,

        totalLocations,
        activeLocations,
        inactiveLocations,
        filteredLocations,
        visibleLocations,

        page,
        setPage,
        totalPages,
        canGoPrev,
        canGoNext,

        isFormOpen,
        handleOpenFormChange,
        isSubmitting,
        editingLocation,
        openCreateDialog,
        openEditDialog,

        formState,
        setFormState,
        formWarehouseLabel,
        formWarehouseSelectValue,
        handleSubmitForm,

        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        deleteTarget,
        openDeleteDialog,
        handleDeleteLocation,

        warehouseNameMap,
    } = useLocationsPageLogic();

    return (
        <div className="space-y-4 sm:space-y-6">
            <PageHeader
                title="Vị trí lưu trữ"
                description="Quản lý vị trí theo kho và tra cứu nhanh zone/aisle/rack/bin để vận hành nhập - xuất chính xác."
                actions={
                    <Button
                        type="button"
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={openCreateDialog}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm vị trí
                    </Button>
                }
            />

            {isLocationsFetching && !isLocationsLoading ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                    Đang cập nhật dữ liệu vị trí...
                </p>
            ) : null}

            {!isLocationsLoading && !locationsError ? (
                <LocationsStats
                    totalLocations={totalLocations}
                    activeLocations={activeLocations}
                    inactiveLocations={inactiveLocations}
                    filteredCount={filteredLocations.length}
                />
            ) : null}

            <LocationsFilters
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                warehouseFilter={warehouseFilter}
                onWarehouseFilterChange={setWarehouseFilter}
                selectedWarehouseLabel={selectedWarehouseLabel}
                isWarehousesLoading={isWarehousesLoading}
                warehouses={warehouses}
            />

            {!isLocationsLoading && !locationsError && filteredLocations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <EmptyState
                        icon={searchInput.trim() ? SearchX : Layers3}
                        title={searchInput.trim() ? "Không tìm thấy vị trí phù hợp" : "Chưa có vị trí lưu trữ"}
                        description={
                            searchInput.trim()
                                ? "Thử từ khóa khác hoặc đổi bộ lọc kho để tìm lại dữ liệu."
                                : "Kho hiện tại chưa có dữ liệu vị trí. Bạn có thể tạo vị trí từ API/backoffice."
                        }
                        className="py-10"
                    />
                </div>
            ) : (
                <LocationsTable
                    visibleLocations={visibleLocations}
                    warehouseNameMap={warehouseNameMap}
                    page={page}
                    totalPages={totalPages}
                    totalElements={isLocationsLoading || locationsError ? 0 : filteredLocations.length}
                    canGoPrev={canGoPrev}
                    canGoNext={canGoNext}
                    isLoading={isLocationsLoading}
                    errorMessage={
                        locationsError
                            ? apiErrMessage(locationsError, "Unable to find instance for warehouse-service")
                            : null
                    }
                    isFetching={isLocationsFetching}
                    onPrevPage={() => setPage((current) => Math.max(0, current - 1))}
                    onNextPage={() => setPage((current) => current + 1)}
                    onRetry={() => refetchLocations()}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                />
            )}
            <LocationFormDialog
                open={isFormOpen}
                onOpenChange={handleOpenFormChange}
                editingLocation={editingLocation}
                isSubmitting={isSubmitting}
                formState={formState}
                setFormState={setFormState}
                formWarehouseSelectValue={formWarehouseSelectValue}
                formWarehouseLabel={formWarehouseLabel}
                warehouses={warehouses}
                onSubmit={handleSubmitForm}
            />

            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteLocation}
                itemName={deleteTarget?.code || ""}
                title="Xóa vị trí"
                description="Hành động này không thể hoàn tác."
            />
        </div>
    );
}
