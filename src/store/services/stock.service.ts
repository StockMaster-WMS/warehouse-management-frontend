import { baseApi } from "@/store/services/api";
import type { ApiQueryArgs } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  StockExpanded,
  StockSummaryResponse,
  NearExpiryStockResponse,
  StockAdjustCommand,
  StockReserveCommand,
  StockMovementResponse,
} from "@/types/stock";

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

export type GetStockMovementsParams = {
  warehouseId?: string;
  locationId?: string;
  productId?: string;
  movementType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
};

export type GetNearExpiryParams = {
  days?: number;
  warehouseId?: string;
  locationId?: string;
  productId?: string;
};

export type ExportStockParams = {
  warehouseId?: string;
  locationId?: string;
  productId?: string;
};

export type ExportNearExpiryParams = {
  days?: number;
  warehouseId?: string;
  locationId?: string;
  productId?: string;
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

function buildMovementsQueryParams(params: GetStockMovementsParams) {
  const {
    warehouseId,
    locationId,
    productId,
    movementType,
    from,
    to,
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
  } = params;
  const query: Record<string, string | number> = { page, size, sort, sortDir };
  const wh = warehouseId?.trim();
  if (wh) query.warehouseId = wh;
  const loc = locationId?.trim();
  if (loc) query.locationId = loc;
  const prod = productId?.trim();
  if (prod) query.productId = prod;
  const mt = movementType?.trim();
  if (mt) query.movementType = mt;
  if (from) query.from = from;
  if (to) query.to = to;
  return query;
}

function buildFilterParams(params: Record<string, string | number | undefined>) {
  const query: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val != null && String(val).trim()) {
      query[key] = typeof val === "string" ? val.trim() : val;
    }
  }
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

    /** Summary dashboard for inventory (6 cards). */
    getStockSummary: builder.query<ApiResponse<StockSummaryResponse>, { nearExpiryDays?: number }>({
      query: ({ nearExpiryDays = 30 } = {}) => ({
        url: "/stocks/summary",
        method: "GET",
        params: { nearExpiryDays },
      }),
      providesTags: [{ type: "Stock", id: "SUMMARY" }],
    }),

    /** Low stock alerts (no pagination). */
    getLowStockAlerts: builder.query<ApiResponse<StockExpanded[]>, { warehouseId?: string; locationId?: string } | void>({
      query: (params) => ({
        url: "/stocks/alerts/low-stock",
        method: "GET",
        params: buildFilterParams({
          warehouseId: params?.warehouseId,
          locationId: params?.locationId,
        }),
      }),
      providesTags: [{ type: "Stock", id: "LOW_STOCK" }],
    }),

    /** Near expiry alerts (no pagination). */
    getNearExpiryAlerts: builder.query<ApiResponse<NearExpiryStockResponse[]>, GetNearExpiryParams>({
      query: (params) => ({
        url: "/stocks/alerts/near-expiry",
        method: "GET",
        params: buildFilterParams({
          days: params.days ?? 30,
          warehouseId: params.warehouseId,
          locationId: params.locationId,
          productId: params.productId,
        }),
      }),
      providesTags: [{ type: "Stock", id: "NEAR_EXPIRY" }],
    }),

    /** Adjust stock qty (+/-). */
    adjustStock: builder.mutation<ApiResponse<unknown>, StockAdjustCommand>({
      query: (body) => ({
        url: "/stocks/adjust",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [
        { type: "Stock", id: "LIST" },
        { type: "Stock", id: "SUMMARY" },
        { type: "Stock", id: "LOW_STOCK" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    /** Adjust reserved qty (+/-). */
    adjustReserved: builder.mutation<ApiResponse<unknown>, StockReserveCommand>({
      query: (body) => ({
        url: "/stocks/adjust-reserved",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [
        { type: "Stock", id: "LIST" },
        { type: "Stock", id: "SUMMARY" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    /** Export stock report as XLSX blob. */
    exportStockReport: builder.query<Blob, ExportStockParams>({
      query: (params) => ({
        url: "/stocks/export",
        method: "GET",
        params: buildFilterParams({
          warehouseId: params.warehouseId,
          locationId: params.locationId,
          productId: params.productId,
        }),
        responseType: "blob",
      } satisfies ApiQueryArgs),
    }),

    /** Export near-expiry report as XLSX blob. */
    exportNearExpiryReport: builder.query<Blob, ExportNearExpiryParams>({
      query: (params) => ({
        url: "/stocks/reports/near-expiry-export",
        method: "GET",
        params: buildFilterParams({
          days: params.days ?? 30,
          warehouseId: params.warehouseId,
          locationId: params.locationId,
          productId: params.productId,
        }),
        responseType: "blob",
      } satisfies ApiQueryArgs),
    }),

    /** Export low-stock report as XLSX blob. */
    exportLowStockReport: builder.query<Blob, ExportStockParams>({
      query: (params) => ({
        url: "/stocks/reports/low-stock-export",
        method: "GET",
        params: buildFilterParams({
          warehouseId: params.warehouseId,
          locationId: params.locationId,
          productId: params.productId,
        }),
        responseType: "blob",
      } satisfies ApiQueryArgs),
    }),

    /** Stock movements history (paginated). */
    getStockMovements: builder.query<
      ApiResponse<PagedResponse<StockMovementResponse>>,
      GetStockMovementsParams
    >({
      query: (params) => ({
        url: "/stocks/movements",
        method: "GET",
        params: buildMovementsQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<StockMovementResponse[] | PagedResponse<StockMovementResponse>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result) =>
        result?.data?.content?.length
          ? [
              ...result.data.content.map((m) => ({
                type: "StockMovement" as const,
                id: m.id,
              })),
              { type: "StockMovement" as const, id: "LIST" },
            ]
          : [{ type: "StockMovement" as const, id: "LIST" }],
    }),
  }),
});

export const {
  useGetStocksQuery,
  useGetStockListQuery,
  useGetStockSummaryQuery,
  useGetLowStockAlertsQuery,
  useGetNearExpiryAlertsQuery,
  useAdjustStockMutation,
  useAdjustReservedMutation,
  useLazyExportStockReportQuery,
  useLazyExportNearExpiryReportQuery,
  useLazyExportLowStockReportQuery,
  useGetStockMovementsQuery,
} = stockApi;
