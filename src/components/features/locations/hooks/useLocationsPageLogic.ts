import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiErrMessage } from "@/types/api";
import type { LocationOption } from "@/types/purchase-order";
import {
    useCreateLocationMutation,
    useDeleteLocationMutation,
    useUpdateLocationMutation,
} from "@/store/services/location.service";
import { useGetLocationsQuery } from "@/store/services/purchase-order.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import {
    ALL_WAREHOUSES,
    DEFAULT_LOCATION_FORM_STATE,
    LOCATIONS_PAGE_SIZE,
    UNSELECTED_WAREHOUSE,
    type LocationFormState,
} from "@/components/features/locations/constants";
import { buildLocationUpsertPayload } from "@/components/features/locations/schemas/location-form.schema";
import { matchesLocationKeyword } from "@/components/features/locations/utils";

export function useLocationsPageLogic() {
    const [searchInput, setSearchInput] = useState("");
    const [warehouseFilter, setWarehouseFilter] = useState(ALL_WAREHOUSES);
    const [page, setPage] = useState(0);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationOption | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<LocationOption | null>(null);
    const [formState, setFormState] = useState<LocationFormState>(DEFAULT_LOCATION_FORM_STATE);

    const debouncedKeyword = useDebouncedValue(searchInput.trim());
    const selectedWarehouseId = warehouseFilter === ALL_WAREHOUSES ? undefined : warehouseFilter;

    const {
        data: locationsRes,
        isLoading: isLocationsLoading,
        isFetching: isLocationsFetching,
        error: locationsError,
        refetch: refetchLocations,
    } = useGetLocationsQuery({ warehouseId: selectedWarehouseId });

    const [createLocation, { isLoading: isCreatingLocation }] = useCreateLocationMutation();
    const [updateLocation, { isLoading: isUpdatingLocation }] = useUpdateLocationMutation();
    const [deleteLocation] = useDeleteLocationMutation();

    const {
        data: warehousesRes,
        isLoading: isWarehousesLoading,
        error: warehousesError,
    } = useGetWarehousesQuery({
        page: 0,
        size: 200,
        sort: "name",
        sortDir: "asc",
    });

    const warehouses = warehousesRes?.data?.content ?? [];
    const warehouseNameMap = useMemo(
        () => Object.fromEntries(warehouses.map((warehouse) => [warehouse.id, warehouse.name])),
        [warehouses],
    );

    const selectedWarehouseLabel =
        warehouseFilter === ALL_WAREHOUSES
            ? "Tất cả kho"
            : warehouseNameMap[warehouseFilter] || "Kho đã chọn";

    const locations = locationsRes?.data ?? [];
    const totalLocations = locations.length;
    const activeLocations = locations.filter((location) => location.isActive !== false).length;
    const inactiveLocations = totalLocations - activeLocations;

    const filteredLocations = useMemo(() => {
        if (!debouncedKeyword) {
            return locations;
        }
        return locations.filter((location) => matchesLocationKeyword(location, debouncedKeyword));
    }, [debouncedKeyword, locations]);

    const totalPages = Math.max(1, Math.ceil(filteredLocations.length / LOCATIONS_PAGE_SIZE));
    const canGoPrev = page > 0;
    const canGoNext = page + 1 < totalPages;

    const visibleLocations = useMemo(() => {
        const start = page * LOCATIONS_PAGE_SIZE;
        return filteredLocations.slice(start, start + LOCATIONS_PAGE_SIZE);
    }, [filteredLocations, page]);

    useEffect(() => {
        if (page >= totalPages) {
            setPage(Math.max(0, totalPages - 1));
        }
    }, [page, totalPages]);

    useEffect(() => {
        setPage(0);
    }, [debouncedKeyword, selectedWarehouseId]);

    const isSubmitting = isCreatingLocation || isUpdatingLocation;

    const formWarehouseSelectValue = formState.warehouseId.trim() || UNSELECTED_WAREHOUSE;
    const formWarehouseLabel =
        formWarehouseSelectValue === UNSELECTED_WAREHOUSE
            ? "Chọn kho"
            : warehouseNameMap[formWarehouseSelectValue] || "Kho đã chọn";

    const resetFormState = (warehouseId?: string) => {
        setFormState({
            ...DEFAULT_LOCATION_FORM_STATE,
            warehouseId: warehouseId ?? "",
        });
    };

    const openCreateDialog = () => {
        setEditingLocation(null);
        resetFormState(selectedWarehouseId);
        setIsFormOpen(true);
    };

    const openEditDialog = (location: LocationOption) => {
        setEditingLocation(location);
        setFormState({
            warehouseId: location.warehouseId || "",
            code: location.code || "",
            name: location.name || "",
            zone: location.zone || "",
            aisle: location.aisle || "",
            rack: location.rack || "",
            level: location.level != null ? String(location.level) : "",
            bin: location.bin || "",
            locationType: location.locationType || "",
            isActive: location.isActive !== false,
        });
        setIsFormOpen(true);
    };

    const handleOpenFormChange = (open: boolean) => {
        setIsFormOpen(open);
        if (!open) {
            setEditingLocation(null);
            resetFormState(selectedWarehouseId);
        }
    };

    const handleSubmitForm = async () => {
        const result = buildLocationUpsertPayload(formState);
        if (!result.payload) {
            toast.error(result.errorMessage);
            return false;
        }

        try {
            if (editingLocation) {
                await updateLocation({ id: editingLocation.id, body: result.payload }).unwrap();
                toast.success("Đã cập nhật vị trí");
            } else {
                await createLocation(result.payload).unwrap();
                toast.success("Đã thêm vị trí mới");
            }
            setIsFormOpen(false);
            setEditingLocation(null);
            resetFormState(selectedWarehouseId);
            return true;
        } catch (err) {
            toast.error(apiErrMessage(err, "Không thể lưu vị trí"));
            return false;
        }
    };

    const openDeleteDialog = (location: LocationOption) => {
        setDeleteTarget(location);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteLocation = async () => {
        if (!deleteTarget) {
            return;
        }
        try {
            await deleteLocation({
                id: deleteTarget.id,
                warehouseId: deleteTarget.warehouseId,
            }).unwrap();
            toast.success(`Đã xóa vị trí ${deleteTarget.code || ""}`);
        } catch (err) {
            toast.error(apiErrMessage(err, "Không thể xóa vị trí"));
        } finally {
            setDeleteTarget(null);
            setIsDeleteDialogOpen(false);
        }
    };

    return {
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
    };
}
