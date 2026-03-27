import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type { Stock } from "@/types/stock";

export type GetStocksParams = {
  productId: string;
  warehouseId?: string;
  page?: number;
  size?: number;
  sort?: string;
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

const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStocks: builder.query<
      ApiResponse<PagedResponse<Stock>>,
      GetStocksParams
    >({
      query: (params) => ({
        url: "/stocks",
        method: "GET",
        params: buildStocksQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<Stock[] | PagedResponse<Stock>>) =>
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

export const { useGetStocksQuery } = stockApi;
