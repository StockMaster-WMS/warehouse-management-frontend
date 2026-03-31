import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type { StockExpanded } from "@/types/stock";

export type GetStocksParams = {
  productId: string;
  warehouseId?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type GetStockListParams = {
  warehouseId?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
};

function buildStocksQueryParams(params: GetStocksParams) {
  const { productId, warehouseId, page = 0, size = 100, sort = "updatedAt,desc" } =
    params;
  const query: Record<string, string | number> = {
    productId: productId.trim(),
    page,
    size,
    sort,
  };
  const warehouse = warehouseId?.trim();
  if (warehouse) query.warehouseId = warehouse;
  return query;
}

function buildStockListQueryParams(params: GetStockListParams) {
  const { warehouseId, keyword, page = 0, size = 20, sort = "updatedAt", sortDir = "desc" } = params;
  const query: Record<string, string | number> = { page, size, sort, sortDir };
  const wh = warehouseId?.trim();
  if (wh) query.warehouseId = wh;
  const k = keyword?.trim();
  if (k) query.keyword = k;
  return query;
}

const stockApi = baseApi.injectEndpoints({
  // Turbopack / HMR may evaluate this module multiple times in dev.
  // Allow re-injecting the same endpoint safely.
  overrideExisting: process.env.NODE_ENV !== "production",
  endpoints: (builder) => ({
    getStocks: builder.query<
      ApiResponse<PagedResponse<StockExpanded>>,
      GetStocksParams
    >({
      query: (params) => ({
        url: "/stocks",
        method: "GET",
        params: buildStocksQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<StockExpanded[] | PagedResponse<StockExpanded>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result) =>
        result?.data?.content?.length
          ? [
              ...result.data.content.map((s) => ({
                type: "Stock" as const,
                id: s.id,
              })),
              { type: "Stock" as const, id: "LIST" },
            ]
          : [{ type: "Stock" as const, id: "LIST" }],
    }),

    /** List stocks for inventory page (expanded DTO from backend). */
    getStockList: builder.query<
      ApiResponse<PagedResponse<StockExpanded>>,
      GetStockListParams
    >({
      query: (params) => ({
        url: "/stocks",
        method: "GET",
        params: buildStockListQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<StockExpanded[] | PagedResponse<StockExpanded>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result) =>
        result?.data?.content?.length
          ? [
              ...result.data.content.map((s) => ({
                type: "Stock" as const,
                id: s.id,
              })),
              { type: "Stock" as const, id: "LIST" },
            ]
          : [{ type: "Stock" as const, id: "LIST" }],
    }),
  }),
});

export const { useGetStocksQuery, useGetStockListQuery } = stockApi;
