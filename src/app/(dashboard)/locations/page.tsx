"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
    AlertCircle,
    CheckCircle2,
    CircleOff,
    Layers3,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    SearchX,
    Trash2,
    Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { useGetLocationsQuery } from "@/store/services/purchase-order.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import {
    useCreateLocationMutation,
    useDeleteLocationMutation,
    useUpdateLocationMutation,
} from "@/store/services/location.service";
import { apiErrMessage } from "@/types/api";
import type { LocationOption } from "@/types/purchase-order";

const ALL_WAREHOUSES = "__all_warehouses__";
const UNSELECTED_WAREHOUSE = "__select_warehouse__";
const PAGE_SIZE = 12;

type LocationFormState = {
    warehouseId: string;
    code: string;
    name: string;
    zone: string;
    aisle: string;
    rack: string;
    level: string;
    bin: string;
    locationType: string;
    isActive: boolean;
};

const DEFAULT_FORM_STATE: LocationFormState = {
    warehouseId: "",
    code: "",
    name: "",
    zone: "",
    aisle: "",
    rack: "",
    level: "",
    bin: "",
    locationType: "",
    isActive: true,
};

export default function LocationsPage() {
    const [searchInput, setSearchInput] = useState("");
    const [warehouseFilter, setWarehouseFilter] = useState(ALL_WAREHOUSES);
    const [page, setPage] = useState(0);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationOption | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<LocationOption | null>(null);
    const [formState, setFormState] = useState<LocationFormState>(DEFAULT_FORM_STATE);
    const debouncedKeyword = useDebouncedValue(searchInput.trim());

    const selectedWarehouseId =
        warehouseFilter === ALL_WAREHOUSES ? undefined : warehouseFilter;

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
        () => Object.fromEntries(warehouses.map((w) => [w.id, w.name])),
        [warehouses],
    );

    const selectedWarehouseLabel =
        warehouseFilter === ALL_WAREHOUSES
            ? "Tất cả kho"
            : warehouseNameMap[warehouseFilter] || "Kho đã chọn";

    const formWarehouseSelectValue =
        formState.warehouseId.trim() || UNSELECTED_WAREHOUSE;
    const formWarehouseLabel =
        formWarehouseSelectValue === UNSELECTED_WAREHOUSE
            ? "Chọn kho"
            : warehouseNameMap[formWarehouseSelectValue] || "Kho đã chọn";

    const locations = locationsRes?.data ?? [];
    const totalLocations = locations.length;
    const activeLocations = locations.filter((location) => location.isActive !== false).length;
    const inactiveLocations = totalLocations - activeLocations;

    const filteredLocations = useMemo(() => {
        const keyword = debouncedKeyword.toLowerCase();
        if (!keyword) return locations;
        return locations.filter((location) => {
            const searchable = [
                location.code,
                location.name,
                location.zone,
                location.aisle,
                location.rack,
                location.bin,
                location.locationType,
                location.status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return searchable.includes(keyword);
        });
    }, [debouncedKeyword, locations]);

    const totalPages = Math.max(1, Math.ceil(filteredLocations.length / PAGE_SIZE));
    const canGoPrev = page > 0;
    const canGoNext = page + 1 < totalPages;
    const visibleLocations = useMemo(() => {
        const start = page * PAGE_SIZE;
        return filteredLocations.slice(start, start + PAGE_SIZE);
    }, [filteredLocations, page]);

    useEffect(() => {
        if (page >= totalPages) {
            setPage(Math.max(0, totalPages - 1));
        }
    }, [page, totalPages]);

    useEffect(() => {
        setPage(0);
    }, [debouncedKeyword, selectedWarehouseId]);

    const formatZoneLine = (location: (typeof filteredLocations)[number]) => {
        const zone = location.zone || "-";
        const aisle = location.aisle || "-";
        const rack = location.rack || "-";
        return `Z:${zone} - A:${aisle} - R:${rack}`;
    };

    const isSubmitting = isCreatingLocation || isUpdatingLocation;

    const resetFormState = (warehouseId?: string) => {
        setFormState({
            ...DEFAULT_FORM_STATE,
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

    const buildUpsertPayload = () => {
        const warehouseId = formState.warehouseId.trim();
        const code = formState.code.trim();

        if (!warehouseId) {
            toast.error("Vui lòng chọn kho");
            return null;
        }
        if (!code) {
            toast.error("Vui lòng nhập mã vị trí");
            return null;
        }

        const levelText = formState.level.trim();
        const parsedLevel = levelText ? Number(levelText) : undefined;
        if (typeof parsedLevel === "number" && Number.isNaN(parsedLevel)) {
            toast.error("Level phải là số hợp lệ");
            return null;
        }

        const optional = (value: string) => {
            const trimmed = value.trim();
            return trimmed || undefined;
        };

        return {
            warehouseId,
            code,
            name: optional(formState.name),
            zone: optional(formState.zone),
            aisle: optional(formState.aisle),
            rack: optional(formState.rack),
            level: parsedLevel,
            bin: optional(formState.bin),
            locationType: optional(formState.locationType),
            isActive: formState.isActive,
        };
    };

    const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const payload = buildUpsertPayload();
        if (!payload) return;

        try {
            if (editingLocation) {
                await updateLocation({ id: editingLocation.id, body: payload }).unwrap();
                toast.success("Đã cập nhật vị trí");
            } else {
                await createLocation(payload).unwrap();
                toast.success("Đã thêm vị trí mới");
            }
            setIsFormOpen(false);
            setEditingLocation(null);
            resetFormState(selectedWarehouseId);
        } catch (err) {
            toast.error(apiErrMessage(err, "Không thể lưu vị trí"));
        }
    };

    const handleDeleteLocation = async () => {
        if (!deleteTarget) return;
        try {
            await deleteLocation({
                id: deleteTarget.id,
                warehouseId: deleteTarget.warehouseId,
            }).unwrap();
            toast.success(`Đã xóa vị trí ${deleteTarget.code || deleteTarget.name || ""}`);
        } catch (err) {
            toast.error(apiErrMessage(err, "Không thể xóa vị trí"));
        } finally {
            setDeleteTarget(null);
            setIsDeleteDialogOpen(false);
        }
    };

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
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tổng vị trí</p>
                        <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalLocations}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            Đang dùng
                        </p>
                        <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-200">{activeLocations}</p>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                            Ngừng dùng
                        </p>
                        <p className="mt-2 text-2xl font-black text-rose-800 dark:text-rose-200">{inactiveLocations}</p>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/30">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                            Kết quả lọc
                        </p>
                        <p className="mt-2 text-2xl font-black text-indigo-800 dark:text-indigo-200">{filteredLocations.length}</p>
                    </div>
                </div>
            ) : null}
            <SearchToolbar
                placeholder="Tìm theo mã vị trí, zone, aisle, rack, bin..."
                value={searchInput}
                onValueChange={setSearchInput}
                right={
                    <div className="w-full sm:w-70">
                        <Select
                            value={warehouseFilter}
                            onValueChange={(value) =>
                                setWarehouseFilter(value ?? ALL_WAREHOUSES)
                            }
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
            {isLocationsLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={`location-skeleton-${i}`}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-36" />
                                <Skeleton className="h-4 w-52" />
                                <Skeleton className="h-4 w-44" />
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Skeleton className="h-7 w-full rounded-lg" />
                                    <Skeleton className="h-7 w-full rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : locationsError ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <EmptyState
                        icon={AlertCircle}
                        title="Không thể tải danh sách vị trí"
                        description={apiErrMessage(locationsError, "Đã xảy ra lỗi khi tải vị trí lưu trữ.")}
                        action={
                            <button
                                type="button"
                                onClick={() => refetchLocations()}
                                className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Thử lại
                            </button>
                        }
                        className="py-10"
                    />
                </div>
            ) : filteredLocations.length === 0 ? (
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
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-3 py-3 text-center">Mã vị trí</TableHead>
                                    <TableHead className="px-3 py-3">Kho</TableHead>
                                    <TableHead className="px-3 py-3">Khu vực</TableHead>
                                    <TableHead className="px-3 py-3 text-center">Bin / Level</TableHead>
                                    <TableHead className="px-3 py-3 text-center">Loại</TableHead>
                                    <TableHead className="px-3 py-3 text-center">Trạng thái</TableHead>
                                    <TableHead className="px-3 py-3 text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleLocations.map((location) => {
                                    const warehouseName = warehouseNameMap[location.warehouseId];
                                    const locationCode = location.code || location.name || "--";

                                    return (
                                        <TableRow key={location.id}>
                                            <TableCell className="px-3 py-3 text-center align-top">
                                                <div>
                                                    <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                                        {locationCode}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {location.name?.trim() || "Chưa đặt tên vị trí"}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 align-top">
                                                <span className="text-xs text-slate-700 dark:text-slate-200">
                                                    {warehouseName || "Kho chưa xác định"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 align-top">
                                                <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                                                    {formatZoneLine(location)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-center align-top">
                                                <span className="text-xs text-slate-700 dark:text-slate-200">
                                                    Bin {location.bin || "-"} / Lv {location.level ?? "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-center align-top">
                                                <Badge variant="outline">{location.locationType || "-"}</Badge>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-center align-top">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                                                    {location.isActive === false ? (
                                                        <>
                                                            <CircleOff className="h-3.5 w-3.5 text-rose-500" />
                                                            <span className="text-rose-600 dark:text-rose-300">Ngừng dùng</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                            <span className="text-emerald-600 dark:text-emerald-300">Đang dùng</span>
                                                        </>
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right align-top">
                                                <div className="inline-flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditDialog(location)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Sửa
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-rose-600 hover:text-rose-600"
                                                        onClick={() => {
                                                            setDeleteTarget(location);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                        {visibleLocations.map((location) => {
                            const warehouseName = warehouseNameMap[location.warehouseId];
                            const locationCode = location.code || location.name || "--";

                            return (
                                <div
                                    key={location.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                                                {locationCode}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {location.name?.trim() || "Chưa đặt tên vị trí"}
                                            </p>
                                        </div>
                                        <Badge variant={location.isActive === false ? "secondary" : "default"}>
                                            {location.isActive === false ? "Ngừng dùng" : "Đang dùng"}
                                        </Badge>
                                    </div>

                                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                        <p className="flex items-center gap-2">
                                            <Warehouse className="h-3.5 w-3.5" />
                                            {warehouseName || "Kho chưa xác định"}
                                        </p>
                                        <p className="flex items-center gap-2 font-mono">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {formatZoneLine(location)}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <Badge variant="outline">Bin: {location.bin || "-"}</Badge>
                                        <Badge variant="outline">Level: {location.level ?? "-"}</Badge>
                                        {location.locationType ? (
                                            <Badge variant="outline">Type: {location.locationType}</Badge>
                                        ) : null}
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(location)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Sửa
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-rose-600 hover:text-rose-600"
                                            onClick={() => {
                                                setDeleteTarget(location);
                                                setIsDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Xóa
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <PaginationFooter
                        itemLabel="vị trí"
                        rowsCount={visibleLocations.length}
                        page={page}
                        totalElements={filteredLocations.length}
                        totalPages={totalPages}
                        canGoPrev={canGoPrev}
                        canGoNext={canGoNext}
                        isFetching={isLocationsFetching}
                        onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
                        onNextPage={() => setPage((p) => p + 1)}
                        pageSize={PAGE_SIZE}
                    />
                </div>
            )}

            {warehousesError ? (
                <p className="text-xs text-amber-600 dark:text-amber-300">
                    Không thể tải đầy đủ tên kho. Dữ liệu vị trí vẫn hiển thị bình thường.
                </p>
            ) : null}

            <Dialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) {
                        setEditingLocation(null);
                        resetFormState(selectedWarehouseId);
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingLocation ? "Sửa vị trí" : "Thêm vị trí mới"}</DialogTitle>
                        <DialogDescription>
                            Nhập thông tin vị trí lưu trữ để đồng bộ dữ liệu kho.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-3" onSubmit={handleSubmitForm}>
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
                                        <SelectValue>{formWarehouseLabel}</SelectValue>
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                                disabled={isSubmitting}
                            >
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

            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteLocation}
                itemName={deleteTarget?.code || deleteTarget?.name || ""}
                title="Xóa vị trí"
                description="Hành động này không thể hoàn tác."
            />
        </div>
    );
}
