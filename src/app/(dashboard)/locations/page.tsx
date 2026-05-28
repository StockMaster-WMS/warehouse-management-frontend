"use client";

import { Layers3, Plus, SearchX, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
    LocationFormDialog,
    BulkLocationDialog,
    LocationBarcodeModal,
    LocationsFilters,
    LocationsStats,
    LocationsTable,
    LocationCodeGuide,
    useLocationsPageLogic,
} from "@/components/features/locations";
import { apiErrMessage } from "@/types/api";
import { useState } from "react";
import type { Location } from "@/types/location";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import { ImportExportXlsxMenu } from "@/components/features/ImportExportXlsxMenu";
import { PermissionControl, useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";

export default function LocationsPage() {
    const [barcodeLocation, setBarcodeLocation] = useState<Location | null>(null);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const canManageLocations = useHasPermissions(ADMIN_MANAGER_ROLES);
        const {
        searchInput,
        setSearchInput,
        warehouseFilter,
        setWarehouseFilter,
        warehouses,
        isWarehousesLoading,
        selectedWarehouseLabel,

        locationsError,
        isLocationsLoading,
        isLocationsFetching,
        refetchLocations,

        totalLocations,
        activeLocations,
        inactiveLocations,
        locations,

        page,
        setPage,
        pageSize,
        setPageSize,
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
        handleBulkDeleteLocations,

        warehouseNameMap,
    } = useLocationsPageLogic();

    return (
        <div className="space-y-4 sm:space-y-6">
            <PageHeader
                title="Vị trí lưu trữ"
                description="Quản lý vị trí theo kho và tra cứu nhanh zone/aisle/rack/bin để vận hành nhập - xuất chính xác."
                actions={
                    <div className="flex items-center gap-2">
                        <ImportExportXlsxMenu
                            triggerClassName="border-slate-200"
                            menuGroupLabel="Vị trí lưu trữ"
                            exportItemLabel="Xuất mẫu hiện tại"
                            templateItemLabel="Tải mẫu vị trí"
                            importItemLabel="Import Excel"
                            templateBasename="location-import-template"
                            getTemplateMatrix={() => [
                                ["warehouseCode", "zone", "aisle", "rack", "level", "bin", "locationType", "isActive"],
                                ["WH-A", "MAIN", "A01", "R01", "1", "B01", "PICKING", "TRUE"],
                            ]}
                            getExportFilename={() => `locations-${new Date().toISOString().slice(0, 10)}.xlsx`}
                            getExportMatrix={() => [
                                ["code", "warehouse", "zone", "aisle", "rack", "level", "bin", "locationType", "status"],
                                ...locations.map((location) => [
                                    location.code,
                                    warehouseNameMap[location.warehouseId] || location.warehouseId,
                                    location.zone,
                                    location.aisle,
                                    location.rack,
                                    String(location.level ?? ""),
                                    location.bin,
                                    location.locationType,
                                    location.isActive === false ? "INACTIVE" : "ACTIVE",
                                ]),
                            ]}
                            canImport={canManageLocations}
                            importConfig={{
                                expectedHeaders: ["warehouseCode", "zone", "aisle", "rack", "level", "bin"],
                                requiredRowFields: ["warehouseCode", "zone", "aisle", "rack", "level", "bin"],
                                fieldLabels: {
                                    warehouseCode: "Mã kho",
                                    zone: "Khu vực",
                                    aisle: "Dãy",
                                    rack: "Kệ",
                                    level: "Tầng",
                                    bin: "Ngăn",
                                },
                            }}
                            dialogTitle="Kiểm tra file import vị trí"
                            importPreviewCountLabel="dòng vị trí"
                        />
                        <PermissionControl allowedRoles={ADMIN_MANAGER_ROLES}>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => setIsBulkDialogOpen(true)}
                            >
                                <Sparkles className="mr-1 size-3.5" />
                                Tạo hàng loạt
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={openCreateDialog}
                            >
                                <Plus className="mr-1 size-4" />
                                Thêm vị trí
                            </Button>
                        </PermissionControl>
                    </div>
                }
            />

            {isLocationsFetching && !isLocationsLoading ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                    Đang cập nhật dữ liệu vị trí...
                </p>
            ) : null}

            <LocationsStats
                totalLocations={totalLocations}
                activeLocations={activeLocations}
                inactiveLocations={inactiveLocations}
                filteredCount={locations.length}
                isLoading={isLocationsLoading}
            />

            <LocationCodeGuide />

            <LocationsFilters
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                warehouseFilter={warehouseFilter}
                onWarehouseFilterChange={setWarehouseFilter}
                selectedWarehouseLabel={selectedWarehouseLabel}
                isWarehousesLoading={isWarehousesLoading}
                warehouses={warehouses}
                isFetching={isLocationsFetching}
                onRefresh={() => refetchLocations()}
            />

            {!isLocationsLoading && !locationsError && locations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <EmptyState
                        icon={searchInput.trim() ? SearchX : Layers3}
                        title={searchInput.trim() ? "Không tìm thấy vị trí phù hợp" : "Chưa có vị trí lưu trữ"}
                        description={
                            searchInput.trim()
                                ? "Thử từ khóa khác hoặc đổi bộ lọc kho để tìm lại dữ liệu."
                                : "Kho hiện tại chưa có dữ liệu vị trí. Bạn có thể tạo vị trí mới bằng công cụ tạo hàng loạt."
                        }
                        className="py-10"
                    />
                </div>
            ) : (
                <LocationsTable
                    visibleLocations={locations}
                    warehouseNameMap={warehouseNameMap}
                    page={page}
                    totalPages={totalPages}
                    totalElements={isLocationsLoading || locationsError ? 0 : totalLocations}
                    canGoPrev={canGoPrev}
                    canGoNext={canGoNext}
                    isLoading={isLocationsLoading}
                    errorMessage={
                        locationsError
                            ? apiErrMessage(locationsError, "Unable to find instance for warehouse-service")
                            : null
                    }
                    isFetching={isLocationsFetching}
                    pageSize={pageSize}
                    onPrevPage={() => setPage((current) => Math.max(0, current - 1))}
                    onNextPage={() => setPage((current) => current + 1)}
                    onPageSizeChange={(nextSize) => {
                        setPageSize(nextSize);
                        setPage(0);
                    }}
                    onRetry={() => refetchLocations()}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                    onBulkDelete={handleBulkDeleteLocations}
                    onPrintBarcode={setBarcodeLocation}
                    canManageLocations={canManageLocations}
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

            <BulkLocationDialog
                open={isBulkDialogOpen}
                onOpenChange={setIsBulkDialogOpen}
                warehouses={warehouses}
                onSuccess={() => refetchLocations()}
            />

            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteLocation}
                itemName={deleteTarget?.code || ""}
            />

            <LocationBarcodeModal
                open={!!barcodeLocation}
                onOpenChange={(open) => !open && setBarcodeLocation(null)}
                location={barcodeLocation}
                warehouseName={barcodeLocation ? warehouseNameMap[barcodeLocation.warehouseId] || "" : ""}
            />
        </div>
    );
}
