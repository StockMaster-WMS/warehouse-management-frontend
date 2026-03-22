
import { baseApi } from "@/store/services/api";
import { ApiResponse, PagedResponse } from "@/types/api";
import type { Warehouse, WarehouseSummary } from "@/types/warehouse";

export type GetWarehousesParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  isActive?: boolean;
  timezone?: string;
};

function buildWarehousesQueryParams(params: GetWarehousesParams) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    keyword,
    isActive,
    timezone,
  } = params;

  const query: Record<string, string | number | boolean> = {
    page,
    size,
    sort,
    sortDir,
  };
  const k = keyword?.trim();
  if (k) query.keyword = k;
  if (typeof isActive === "boolean") query.isActive = isActive;
  const tz = timezone?.trim();
  if (tz) query.timezone = tz;
  return query;
}

const warehouseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouses: builder.query<
      ApiResponse<PagedResponse<Warehouse>>,
      GetWarehousesParams
    >({
      query: (params) => ({
        url: "/warehouses",
        method: "GET",
        params: buildWarehousesQueryParams(params),
      }),
      providesTags: (result) =>
        result?.data?.content?.length
          ? [
              ...result.data.content.map((w) => ({
                type: "Warehouse" as const,
                id: w.id,
              })),
              { type: "Warehouse" as const, id: "LIST" },
            ]
          : [{ type: "Warehouse" as const, id: "LIST" }],
    }),
    getWarehouseSummary: builder.query<ApiResponse<WarehouseSummary>, void>({
      query: () => ({ url: "/warehouses/summary", method: "GET" }),
      providesTags: () => [{ type: "Warehouse" as const, id: "SUMMARY" }],
    }),
  }),
});

export const { useGetWarehousesQuery, useGetWarehouseSummaryQuery } =
  warehouseApi;
