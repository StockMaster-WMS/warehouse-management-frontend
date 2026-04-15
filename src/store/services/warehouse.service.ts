
import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { Warehouse, WarehouseSummary, CreateWarehouseRequest } from "@/types/warehouse";

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
      transformResponse: (r: ApiResponse<Warehouse[] | PagedResponse<Warehouse>>) => normalizeApiResponsePaged(r),
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
    getWarehouseById: builder.query<ApiResponse<Warehouse>, string>({
      query: (id) => ({ url: `/warehouses/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Warehouse" as const, id }],
    }),
    getWarehouseSummary: builder.query<ApiResponse<WarehouseSummary>, void>({
      query: () => ({ url: "/warehouses/summary", method: "GET" }),
      providesTags: () => [{ type: "Warehouse" as const, id: "SUMMARY" }],
    }),
    createWarehouse: builder.mutation<ApiResponse<Warehouse>, CreateWarehouseRequest>({
      query: (body) => ({
        url: "/warehouses",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [
        { type: "Warehouse", id: "LIST" },
        { type: "Warehouse", id: "SUMMARY" },
      ],
    }),
    updateWarehouse: builder.mutation<ApiResponse<Warehouse>, { id: string; body: CreateWarehouseRequest }>({
      query: ({ id, body }) => ({
        url: `/warehouses/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Warehouse", id: arg.id },
        { type: "Warehouse", id: "LIST" },
        { type: "Warehouse", id: "SUMMARY" },
      ],
    }),
    deleteWarehouse: builder.mutation<ApiResponse<string>, string>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Warehouse", id },
        { type: "Warehouse", id: "LIST" },
        { type: "Warehouse", id: "SUMMARY" },
      ],
    }),
  }),
});

export const {
  useGetWarehousesQuery,
  useGetWarehouseByIdQuery,
  useLazyGetWarehouseByIdQuery,
  useGetWarehouseSummaryQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} = warehouseApi;
