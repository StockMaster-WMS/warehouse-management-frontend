import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useHasPermissions } from "@/components/permission-control";
import {
  useGetWarehousesQuery,
  useGetWarehouseSummaryQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useLazyGetWarehouseByIdQuery,
  useGetWarehouseManagersQuery,
} from "@/store/services/warehouse.service";
import { apiErrMessage } from "@/types/api";
import type { Warehouse, SortDirection, WarehouseSortField } from "@/types/warehouse";
import {
  DEFAULT_WAREHOUSE_FORM_STATE,
  type WarehouseFormState,
} from "@/components/features/warehouses/components/WarehouseFormDialog";
import {
  SORT_DIR_LABELS,
  SORT_DIR_OPTIONS,
  SORT_FIELD_LABELS,
  SORT_FIELD_OPTIONS,
  STATUS_LABEL_ACTIVE,
  STATUS_LABEL_ALL,
  STATUS_LABEL_INACTIVE,
  WAREHOUSES_PAGE_SIZE,
} from "@/components/features/warehouses/constants";

export function useWarehousesPageLogic() {
  const canManageWarehouses = useHasPermissions(["ADMIN"]);
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  // Search + filter state
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(WAREHOUSES_PAGE_SIZE);
  const [sort, setSort] = useState<WarehouseSortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formState, setFormState] = useState<WarehouseFormState>(DEFAULT_WAREHOUSE_FORM_STATE);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, isActive, sort, sortDir]);

  const listParams = useMemo(
    () => ({
      page,
      size,
      sort,
      sortDir,
      keyword: debouncedKeyword || undefined,
      isActive,
    }),
    [page, size, sort, sortDir, debouncedKeyword, isActive],
  );

  const { data, error, isLoading, isFetching, refetch } =
    useGetWarehousesQuery(listParams);

  const { data: summaryData } = useGetWarehouseSummaryQuery();
  const summary = summaryData?.data;
  const { data: managersData, isLoading: isManagersLoading } = useGetWarehouseManagersQuery(undefined, {
    skip: !canManageWarehouses,
  });
  const managers = managersData?.data ?? [];

  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
  const [deleteWarehouse] = useDeleteWarehouseMutation();
  const [fetchWarehouseById] = useLazyGetWarehouseByIdQuery();

  const isSubmitting = isCreating || isUpdating;

  const warehouses = useMemo(() => data?.data?.content ?? [], [data]);
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;

  const statusValue =
    isActive === true
      ? STATUS_LABEL_ACTIVE
      : isActive === false
        ? STATUS_LABEL_INACTIVE
        : STATUS_LABEL_ALL;

  const sortValue =
    SORT_FIELD_OPTIONS.find((label) => SORT_FIELD_LABELS[label] === sort) ??
    "Ngày tạo";

  const sortDirValue =
    SORT_DIR_OPTIONS.find((label) => SORT_DIR_LABELS[label] === sortDir) ??
    "Giảm dần";

  const hasAnyFilter =
    searchInput.trim().length > 0 ||
    typeof isActive === "boolean" ||
    sort !== "createdAt" ||
    sortDir !== "desc";

  const advancedCount =
    Number(typeof isActive === "boolean") + Number(sort !== "createdAt") + Number(sortDir !== "desc");

  const clearFilters = () => {
    setSearchInput("");
    setIsActive(undefined);
    setSort("createdAt");
    setSortDir("desc");
    setPage(0);
    setSize(WAREHOUSES_PAGE_SIZE);
  };

  const handleStatusChange = (value: string) => {
    if (value === STATUS_LABEL_ACTIVE) {
      setIsActive(true);
      return;
    }
    if (value === STATUS_LABEL_INACTIVE) {
      setIsActive(false);
      return;
    }
    setIsActive(undefined);
  };

  // ── Create/Edit dialog ──
  const openCreateDialog = () => {
    setEditingWarehouse(null);
    setFormState(DEFAULT_WAREHOUSE_FORM_STATE);
    setIsFormOpen(true);
  };

  const openEditDialog = async (warehouse: Warehouse) => {
    try {
      const res = await fetchWarehouseById(warehouse.id).unwrap();
      const w = res.data;
      setEditingWarehouse(w);
      setFormState({
        code: w.code ?? "",
        name: w.name ?? "",
        address: w.address ?? "",
        managerIds: w.managers?.map((manager) => manager.id) ?? [],
        timezone: w.timezone ?? "Asia/Ho_Chi_Minh",
        isActive: w.isActive,
      });
      setIsFormOpen(true);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tải thông tin kho"));
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingWarehouse(null);
      setFormState(DEFAULT_WAREHOUSE_FORM_STATE);
    }
  };

  const handleSubmitForm = async (): Promise<boolean> => {
    const code = formState.code.trim();
    const name = formState.name.trim();
    if (!code) {
      toast.error("Mã kho không được để trống");
      return false;
    }
    if (code.length > 20) {
      toast.error("Mã kho không được vượt quá 20 ký tự");
      return false;
    }
    if (!name) {
      toast.error("Tên kho không được để trống");
      return false;
    }
    if (name.length > 150) {
      toast.error("Tên kho không được vượt quá 150 ký tự");
      return false;
    }
    const payload = {
      code,
      name,
      address: formState.address.trim() || undefined,
      managerIds: formState.managerIds,
      timezone: formState.timezone.trim() || undefined,
      isActive: formState.isActive,
    };

    try {
      if (editingWarehouse) {
        await updateWarehouse({ id: editingWarehouse.id, body: payload }).unwrap();
        toast.success("Đã cập nhật kho thành công");
      } else {
        await createWarehouse(payload).unwrap();
        toast.success("Đã tạo kho mới thành công");
      }
      setIsFormOpen(false);
      setEditingWarehouse(null);
      setFormState(DEFAULT_WAREHOUSE_FORM_STATE);
      return true;
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể lưu kho"));
      return false;
    }
  };

  // ── Delete ──
  const openDeleteDialog = (warehouse: Warehouse) => {
    setDeleteTarget(warehouse);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWarehouse(deleteTarget.id).unwrap();
      toast.success(`Đã xóa kho "${deleteTarget.name}"`);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể xóa kho"));
    } finally {
      setDeleteTarget(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return {
    // Delete
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteTarget,

    // Search / filter
    searchInput,
    setSearchInput,
    page,
    setPage,
    size,
    setSize,
    sort,
    setSort,
    sortDir,
    setSortDir,
    isActive,
    advancedOpen,
    setAdvancedOpen,

    // Data
    listParams,
    warehouses,
    totalElements,
    totalPages,
    summary,
    managers,
    isManagersLoading,
    canManageWarehouses,

    error,
    isLoading,
    isFetching,
    refetch,

    // Computed
    statusValue,
    sortValue,
    sortDirValue,
    hasAnyFilter,
    advancedCount,

    clearFilters,
    handleStatusChange,
    openDeleteDialog,
    handleDelete,

    // Form dialog
    isFormOpen,
    handleFormOpenChange,
    editingWarehouse,
    isSubmitting,
    formState,
    setFormState,
    openCreateDialog,
    openEditDialog,
    handleSubmitForm,
  };
}
