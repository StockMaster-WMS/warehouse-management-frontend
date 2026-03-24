import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { Order } from "@/types/order";

export type GetOrdersParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: string;
};

function buildOrdersQueryParams(params: GetOrdersParams) {
  const { page = 0, size = 20, sort = "createdAt", sortDir = "desc", keyword, status } = params;

  const query: Record<string, string | number> = {
    page,
    size,
    sort,
    sortDir,
  };
  const k = keyword?.trim();
  if (k) query.keyword = k;
  const st = status?.trim();
  if (st) query.status = st;
  return query;
}

const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<ApiResponse<PagedResponse<Order>>, GetOrdersParams>({
      query: (params) => ({
        url: "/orders",
        method: "GET",
        params: buildOrdersQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<Order[] | PagedResponse<Order>>) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [...rows.map((o) => ({ type: "Order" as const, id: o.id })), { type: "Order" as const, id: "LIST" }]
          : [{ type: "Order" as const, id: "LIST" }];
      },
    }),
  }),
});

export const { useGetOrdersQuery } = orderApi;
