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
  locationId?: string;
  expand?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
};

export type GetStockListParams = {
  warehouseId?: string;
  productId?: string;
  locationId?: string;
  keyword?: string;
  expand?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
};

function buildStocksQueryParams(params: GetStocksParams) {
  const {
    productId,
    warehouseId,
    locationId,
    expand,
    page = 0,
    size = 100,
    sort = "updatedAt",
    sortDir = "desc",
  } = params;
  const query: Record<string, string | number> = {
    productId: productId.trim(),
    page,
    size,
    sort,
    sortDir,
  };
  const warehouse = warehouseId?.trim();
  if (warehouse) query.warehouseId = warehouse;
  const location = locationId?.trim();
  if (location) query.locationId = location;
  const expanded = expand?.trim();
  if (expanded) query.expand = expanded;
  return query;
}

function buildStockListQueryParams(params: GetStockListParams) {
  const {
    warehouseId,
    productId,
    locationId,
    keyword,
    expand,
    page = 0,
    size = 20,
    sort = "updatedAt",
    sortDir = "desc",
  } = params;
  const query: Record<string, string | number> = { page, size, sort, sortDir };
  const wh = warehouseId?.trim();
  if (wh) query.warehouseId = wh;
  const prod = productId?.trim();
  if (prod) query.productId = prod;
  const location = locationId?.trim();
  if (location) query.locationId = location;
  const k = keyword?.trim();
  if (k) query.keyword = k;
  const expanded = expand?.trim();
  if (expanded) query.expand = expanded;
  return query;
}

const stockApi = baseApi.injectEndpoints({
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
