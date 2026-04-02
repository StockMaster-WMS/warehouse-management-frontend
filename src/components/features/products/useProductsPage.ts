import { useMemo, useState, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetProductsQuery } from "@/store/services/product.service";
import { useGetCategoriesQuery } from "@/store/services/category.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";

const PAGE_SIZE = 20;

export function useProductsPageLogic() {
  // State giao diện cục bộ cho tìm kiếm, bộ lọc, phân trang và hộp thoại xoá.
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "INACTIVE">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");

  // Giữ object query ổn định để RTK Query chỉ gọi lại khi dữ liệu đầu vào thực sự thay đổi.
  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sort: "updatedAt",
      keyword: debouncedKeyword || undefined,
      status: statusFilter || undefined,
      categoryId: categoryFilter || undefined,
      warehouseId: warehouseFilter || undefined,
    }),
    [page, debouncedKeyword, statusFilter, categoryFilter, warehouseFilter],
  );

  // Query danh sách sản phẩm chính, dùng cho bảng và menu xuất dữ liệu.
  const { data, error, isLoading, isFetching, refetch } =
    useGetProductsQuery(listParams);
  const products = useMemo(() => data?.data?.content ?? [], [data]);
  const totalElements = data?.data?.total_elements ?? 0;
  const serverTotalPages = data?.data?.total_pages ?? 0;

  // Dữ liệu tra cứu cho các select ở bộ lọc nâng cao.
  const {
    data: categoryOptionsData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  // Kho được tải riêng vì danh sách lựa chọn thường dài hơn.
  const {
    data: warehouseOptionsData,
    isLoading: warehousesLoading,
    error: warehousesError,
    refetch: refetchWarehouses,
  } = useGetWarehousesQuery({
    page: 0,
    size: 200,
    sort: "createdAt",
    sortDir: "desc",
  });

  // Các cờ được suy ra để dùng cho toolbar, empty state và số lượng bộ lọc đang bật.
  const hasAnyFilter =
    searchInput.trim().length > 0 ||
    Boolean(statusFilter) ||
    Boolean(categoryFilter) ||
    Boolean(warehouseFilter);
  const advancedCount =
    Number(Boolean(statusFilter)) +
    Number(Boolean(categoryFilter)) +
    Number(Boolean(warehouseFilter));

  // Giới hạn phân trang dùng cho nút trước/sau.
  const canGoPrev = page > 0;
  const canGoNext = serverTotalPages > 0 && page < serverTotalPages - 1;

  // Thông tin thẻ thống kê hiển thị phía trên thanh tìm kiếm.
  const stats = useMemo(() => {
    const pageLabel =
      totalElements === 0 ? "—" : `${page + 1} / ${data?.data?.total_pages ?? 1}`;

    return [
      { label: "Tổng SKU", value: totalElements.toString() },
      { label: "Trang (hiện tại / tổng)", value: pageLabel },
      { label: "Vị trí lưu trữ", value: "N/A" },
      { label: "Giá trị hàng", value: "N/A" },
    ];
  }, [totalElements, page, data?.data?.total_pages]);

  // Các thao tác dùng chung, luôn đưa trang về 0 khi phạm vi dữ liệu thay đổi.
  const clearFilters = useCallback(() => {
    setSearchInput("");
    setStatusFilter("");
    setCategoryFilter("");
    setWarehouseFilter("");
    setPage(0);
    setAdvancedOpen(false);
  }, []);

  const handleRequestDelete = useCallback((name: string) => {
    setItemToDelete(name);
    setIsDeleteDialogOpen(true);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setPage(0);
  }, []);

  return {
    // State được expose cho component trang.
    searchInput,
    page,
    statusFilter,
    categoryFilter,
    warehouseFilter,
    advancedOpen,
    isDeleteDialogOpen,
    itemToDelete,

    // Các setter bao bọc state gốc để trang có thể reset phân trang nhất quán.
    setSearchInput: handleSearchChange,
    setStatusFilter: (status: "" | "ACTIVE" | "INACTIVE" | null) => {
      setStatusFilter(typeof status === "string" ? status : "");
      setPage(0);
    },
    setCategoryFilter: (category: string | null) => {
      setCategoryFilter(category ?? "");
      setPage(0);
    },
    setWarehouseFilter: (warehouse: string | null) => {
      setWarehouseFilter(warehouse ?? "");
      setPage(0);
    },
    setAdvancedOpen,
    setIsDeleteDialogOpen,

    // Kết quả query và cờ đang tải.
    products,
    error,
    isLoading,
    isFetching,
    totalElements,
    serverTotalPages,
    listParams,

    // Danh sách lựa chọn cho bộ lọc nâng cao.
    categoryOptionsData,
    categoriesLoading,
    categoriesError,
    refetchCategories,
    warehouseOptionsData,
    warehousesLoading,
    warehousesError,
    refetchWarehouses,

    // Trạng thái bộ lọc được suy ra cho badge UI và empty state.
    hasAnyFilter,
    advancedCount,

    // Điều khiển phân trang.
    canGoPrev,
    canGoNext,

    // Các thẻ thống kê phía trên thanh tìm kiếm.
    stats,

    // Các thao tác được dùng bởi trang và từng dòng trong bảng.
    clearFilters,
    handleRequestDelete,
    handlePrevPage,
    handleNextPage,
    refetch,
  };
}

