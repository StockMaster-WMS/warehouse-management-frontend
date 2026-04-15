import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiErrMessage } from "@/types/api";
import {
  useGetStockListQuery,
  useGetStockSummaryQuery,
  useGetLowStockAlertsQuery,
  useGetNearExpiryAlertsQuery,
  useAdjustStockMutation,
  useAdjustReservedMutation,
  useLazyExportStockReportQuery,
  useLazyExportNearExpiryReportQuery,
  useLazyExportLowStockReportQuery,
} from "@/store/services/stock.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useGetLocationsListQuery } from "@/store/services/location.service";
import { useGetProductsQuery } from "@/store/services/product.service";
import {
  INVENTORY_PAGE_SIZE,
  NEAR_EXPIRY_DAYS_DEFAULT,
  DEFAULT_ADJUST_FORM,
  type AdjustFormState,
} from "@/components/features/inventory/constants";
import { downloadBlob } from "@/components/features/inventory/utils";
import type { StockExpanded } from "@/types/stock";

export type InventoryTab = "stock" | "low-stock" | "near-expiry";

export function useInventoryPageLogic() {
  // ── Tab mode ──
  const [activeTab, setActiveTab] = useState<InventoryTab>("stock");

  // ── Filters ──
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const debouncedKeyword = useDebouncedValue(searchInput.trim());

  // ── Adjust dialogs ──
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<"qty" | "reserved">("qty");
  const [adjustForm, setAdjustForm] = useState<AdjustFormState>(DEFAULT_ADJUST_FORM);

  // ── Advanced filter toggle ──
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const advancedCount = useMemo(() => {
    let count = warehouseId ? 1 : 0;
    if (activeTab !== "stock") count++;
    return count;
  }, [warehouseId, activeTab]);

  const hasAnyFilter = !!(searchInput.trim() || warehouseId || activeTab !== "stock");

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setWarehouseId("");
    setLocationId("");
    setActiveTab("stock");
    setPage(0);
  }, []);

  // ── Summary (6 cards) ──
  const {
    data: summaryRes,
    isLoading: isSummaryLoading,
  } = useGetStockSummaryQuery({ nearExpiryDays: NEAR_EXPIRY_DAYS_DEFAULT });
  const summary = summaryRes?.data ?? null;

  // ── Warehouses for dropdown ──
  const { data: warehousesRes, isLoading: isWarehousesLoading } = useGetWarehousesQuery({
    page: 0,
    size: 200,
    sort: "name",
    sortDir: "asc",
  });
  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);

  // ── Locations for adjust dialog ──
  const { data: locationsRes, isLoading: isLocationsLoading } = useGetLocationsListQuery(
    { page: 0, size: 500, warehouseId: adjustForm.warehouseId || undefined },
    { skip: !adjustDialogOpen || !adjustForm.warehouseId },
  );
  const adjustLocations = useMemo(() => locationsRes?.data?.content ?? [], [locationsRes]);

  // ── Products for adjust dialog ──
  const { data: productsRes, isLoading: isProductsLoading } = useGetProductsQuery(
    { page: 0, size: 500, sort: "name", status: "ACTIVE" },
    { skip: !adjustDialogOpen },
  );
  const adjustProducts = useMemo(() => productsRes?.data?.content ?? [], [productsRes]);

  // ── Stock list (main tab) ──
  const {
    data: stockListRes,
    isLoading: isStockListLoading,
    isFetching: isStockListFetching,
    error: stockListError,
    refetch: refetchStockList,
  } = useGetStockListQuery({
    page,
    size: INVENTORY_PAGE_SIZE,
    sort: "updatedAt",
    sortDir: "desc",
    warehouseId: warehouseId || undefined,
    locationId: locationId || undefined,
    keyword: debouncedKeyword || undefined,
  });
  const stockList = useMemo(() => stockListRes?.data?.content ?? [], [stockListRes]);
  const stockTotalElements = stockListRes?.data?.total_elements ?? 0;
  const stockTotalPages = stockListRes?.data?.total_pages ?? 0;

  // ── Low stock alerts ──
  const {
    data: lowStockRes,
    isLoading: isLowStockLoading,
    error: lowStockError,
    refetch: refetchLowStock,
  } = useGetLowStockAlertsQuery(undefined, { skip: activeTab !== "low-stock" });
  const lowStockItems = useMemo(() => lowStockRes?.data ?? [], [lowStockRes]);

  // ── Near expiry alerts ──
  const {
    data: nearExpiryRes,
    isLoading: isNearExpiryLoading,
    error: nearExpiryError,
    refetch: refetchNearExpiry,
  } = useGetNearExpiryAlertsQuery(
    {
      days: NEAR_EXPIRY_DAYS_DEFAULT,
      warehouseId: warehouseId || undefined,
      locationId: locationId || undefined,
    },
    { skip: activeTab !== "near-expiry" }
  );
  const nearExpiryItems = useMemo(() => nearExpiryRes?.data ?? [], [nearExpiryRes]);

  // ── Unified display items ──
  const displayItems = useMemo(() => {
    if (activeTab === "low-stock") return lowStockItems;
    if (activeTab === "near-expiry") {
      return nearExpiryItems.map(item => ({
        ...item,
        warehouse: { id: item.warehouseId, code: item.warehouseCode, name: item.warehouseCode },
        location: { id: item.locationId, code: item.locationCode, name: item.locationCode },
        product: { id: item.productId, sku: "", name: "Sản phẩm " + item.productId, minQty: null },
        updatedAt: new Date().toISOString(),
      } as StockExpanded));
    }
    return stockList;
  }, [activeTab, stockList, lowStockItems, nearExpiryItems]);

  const displayTotalElements = useMemo(() => {
    if (activeTab === "low-stock") return lowStockItems.length;
    if (activeTab === "near-expiry") return nearExpiryItems.length;
    return stockTotalElements;
  }, [activeTab, stockTotalElements, lowStockItems.length, nearExpiryItems.length]);

  const displayTotalPages = useMemo(() => {
    if (activeTab === "low-stock") return 1;
    if (activeTab === "near-expiry") return 1;
    return stockTotalPages;
  }, [activeTab, stockTotalPages]);

  // ── Adjust mutations ──
  const [adjustStock, { isLoading: isAdjustingStock }] = useAdjustStockMutation();
  const [adjustReserved, { isLoading: isAdjustingReserved }] = useAdjustReservedMutation();
  const isAdjusting = isAdjustingStock || isAdjustingReserved;

  // ── Export ──
  const [triggerExportStock] = useLazyExportStockReportQuery();
  const [triggerExportNearExpiry] = useLazyExportNearExpiryReportQuery();
  const [triggerExportLowStock] = useLazyExportLowStockReportQuery();

  // ── Reset page assistants ──
  const handleTabChange = useCallback((tab: InventoryTab) => {
    setActiveTab(tab);
    setPage(0);
  }, []);

  const handleWarehouseChange = useCallback((id: string) => {
    setWarehouseId(id);
    setPage(0);
  }, []);

  const handleLocationChange = useCallback((id: string) => {
    setLocationId(id);
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    setPage(0);
  }, []);

  // ── Pagination ──
  const canGoPrev = page > 0;
  const canGoNext = displayTotalPages > 0 && page + 1 < displayTotalPages;

  // ── Handlers ──
  const openAdjustDialog = (type: "qty" | "reserved") => {
    setAdjustType(type);
    setAdjustForm({ ...DEFAULT_ADJUST_FORM, warehouseId });
    setAdjustDialogOpen(true);
  };

  const handleAdjustSubmit = async () => {
    const delta = Number(adjustForm.delta);
    if (!delta || Number.isNaN(delta)) {
      toast.error("Số lượng thay đổi phải khác 0");
      return false;
    }
    if (!adjustForm.warehouseId.trim()) { toast.error("Vui lòng chọn kho"); return false; }
    if (!adjustForm.locationId.trim()) { toast.error("Vui lòng chọn vị trí"); return false; }
    if (!adjustForm.productId.trim()) { toast.error("Vui lòng chọn sản phẩm"); return false; }

    try {
      if (adjustType === "qty") {
        await adjustStock({
          warehouseId: adjustForm.warehouseId,
          locationId: adjustForm.locationId,
          productId: adjustForm.productId,
          lotNumber: adjustForm.lotNumber.trim() || undefined,
          qtyDelta: delta,
        }).unwrap();
        toast.success(`Đã điều chỉnh tồn kho ${delta > 0 ? "+" : ""}${delta}`);
      } else {
        await adjustReserved({
          warehouseId: adjustForm.warehouseId,
          locationId: adjustForm.locationId,
          productId: adjustForm.productId,
          lotNumber: adjustForm.lotNumber.trim() || undefined,
          reservedDelta: delta,
        }).unwrap();
        toast.success(`Đã điều chỉnh giữ chỗ ${delta > 0 ? "+" : ""}${delta}`);
      }
      setAdjustDialogOpen(false);
      setAdjustForm(DEFAULT_ADJUST_FORM);
      return true;
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể điều chỉnh tồn kho"));
      return false;
    }
  };

  const handleExportStock = async () => {
    try {
      const result = await triggerExportStock({
        warehouseId: warehouseId || undefined,
        locationId: locationId || undefined,
      }).unwrap();
      downloadBlob(result, `stock-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Đã xuất báo cáo tồn kho");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể xuất báo cáo"));
    }
  };

  const handleExportNearExpiry = async () => {
    try {
      const result = await triggerExportNearExpiry({
        days: NEAR_EXPIRY_DAYS_DEFAULT,
        warehouseId: warehouseId || undefined,
        locationId: locationId || undefined,
      }).unwrap();
      downloadBlob(result, `near-expiry-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Đã xuất báo cáo hàng sắp hết hạn");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể xuất báo cáo"));
    }
  };

  const handleExportLowStock = async () => {
    try {
      const result = await triggerExportLowStock({
        warehouseId: warehouseId || undefined,
        locationId: locationId || undefined,
      }).unwrap();
      downloadBlob(result, `low-stock-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Đã xuất báo cáo tồn kho thấp");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể xuất báo cáo"));
    }
  };

  return {
    activeTab, setActiveTab: handleTabChange,
    warehouseId, setWarehouseId: handleWarehouseChange,
    locationId, setLocationId: handleLocationChange,
    searchInput, setSearchInput: handleSearchChange,
    warehouses, isWarehousesLoading,
    advancedOpen, setAdvancedOpen,
    advancedCount, hasAnyFilter, clearFilters,
    summary, isSummaryLoading,
    displayItems, displayTotalElements, displayTotalPages,
    isDataLoading: isStockListLoading || isLowStockLoading || isNearExpiryLoading,
    isDataFetching: isStockListFetching,
    itemsError: stockListError || lowStockError || nearExpiryError,
    page, setPage, canGoPrev, canGoNext,
    adjustDialogOpen, setAdjustDialogOpen,
    adjustType, adjustForm, setAdjustForm, isAdjusting,
    openAdjustDialog, handleAdjustSubmit,
    adjustLocations, isLocationsLoading,
    adjustProducts, isProductsLoading,
    handleExportStock, handleExportNearExpiry, handleExportLowStock,
    refetchAll: () => { refetchStockList(); refetchLowStock(); refetchNearExpiry(); }
  };
}
