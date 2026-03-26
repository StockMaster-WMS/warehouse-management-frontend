import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { SalesOrder } from "@/types/sales-order";

export type GetOrdersParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: string;
};

export type CreateSalesOrderPayload = {
  customerName: string;
  shippingAddress: {
    line1: string;
    ward: string;
    district: string;
    city: string;
    country: string;
  };
  warehouseId: string;
  priority?: number;
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
    getSalesOrders: builder.query<ApiResponse<PagedResponse<SalesOrder>>, GetOrdersParams>({
      query: (params) => ({
        url: "/sales-orders",
        method: "GET",
        params: buildOrdersQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<SalesOrder[] | PagedResponse<SalesOrder>>) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [
              ...rows.map((o) => ({ type: "SalesOrder" as const, id: o.id })),
              { type: "SalesOrder" as const, id: "LIST" },
            ]
          : [{ type: "SalesOrder" as const, id: "LIST" }];
      },
    }),
    getSalesOrderById: builder.query<ApiResponse<SalesOrder>, string>({
      query: (id) => ({
        url: `/sales-orders/${id}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "SalesOrder" as const, id }],
    }),

    createSalesOrder: builder.mutation<ApiResponse<SalesOrder>, CreateSalesOrderPayload>({
      query: (data) => ({
        url: "/sales-orders",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "SalesOrder", id: "LIST" }],
    }),

    startPicking: builder.mutation<ApiResponse<SalesOrder>, { salesOrderId: string }>({
      query: ({ salesOrderId }) => ({
        url: `/sales-orders/${salesOrderId}/start-picking`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SalesOrder", id: arg.salesOrderId },
        { type: "SalesOrder", id: "LIST" },
      ],
    }),

    markPacked: builder.mutation<ApiResponse<SalesOrder>, { salesOrderId: string }>({
      query: ({ salesOrderId }) => ({
        url: `/sales-orders/${salesOrderId}/mark-packed`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SalesOrder", id: arg.salesOrderId },
        { type: "SalesOrder", id: "LIST" },
      ],
    }),

    markShipped: builder.mutation<ApiResponse<SalesOrder>, { salesOrderId: string }>({
      query: ({ salesOrderId }) => ({
        url: `/sales-orders/${salesOrderId}/mark-shipped`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SalesOrder", id: arg.salesOrderId },
        { type: "SalesOrder", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useCreateSalesOrderMutation,
  useStartPickingMutation,
  useMarkPackedMutation,
  useMarkShippedMutation,
} = orderApi;
