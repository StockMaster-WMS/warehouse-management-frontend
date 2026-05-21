import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { SalesOrder, UpdateSalesOrderPayload, SalesOrderAction } from "@/types/sales-order";

export type GetOrdersParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type CreateSalesOrderPayload = {
  customerId?: string;
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
  const { page = 0, size = 20, sort = "createdAt", sortDir = "desc", keyword, status, createdFrom, createdTo } = params;

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
  if (createdFrom) query.createdFrom = createdFrom;
  if (createdTo) query.createdTo = createdTo;
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

    getSalesOrderBySoNumber: builder.query<ApiResponse<SalesOrder>, string>({
      query: (soNumber) => ({
        url: `/sales-orders/number/${encodeURIComponent(soNumber.trim())}`,
        method: "GET",
      }),
      providesTags: (result) => {
        const id = result?.data?.id;
        return id ? [{ type: "SalesOrder" as const, id }] : [];
      },
    }),

    createSalesOrder: builder.mutation<ApiResponse<SalesOrder>, CreateSalesOrderPayload>({
      query: (data) => ({
        url: "/sales-orders",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "SalesOrder", id: "LIST" }, { type: "PickingItem", id: "LIST" }],
    }),

    updateSalesOrder: builder.mutation<ApiResponse<SalesOrder>, { id: string; body: UpdateSalesOrderPayload }>({
      query: ({ id, body }) => ({
        url: `/sales-orders/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SalesOrder", id: arg.id },
        { type: "SalesOrder", id: "LIST" },
        { type: "PickingItem", id: "LIST" },
      ],
    }),

    deleteSalesOrder: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({
        url: `/sales-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "SalesOrder", id },
        { type: "SalesOrder", id: "LIST" },
        { type: "PickingItem", id: "LIST" },
      ],
    }),

    executeSalesOrderAction: builder.mutation<
      ApiResponse<SalesOrder>,
      { salesOrderId: string; action: SalesOrderAction }
    >({
      query: ({ salesOrderId, action }) => ({
        url: `/sales-orders/${salesOrderId}/actions`,
        method: "POST",
        data: { action },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SalesOrder", id: arg.salesOrderId },
        { type: "SalesOrder", id: "LIST" },
        { type: "PickingItem", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useLazyGetSalesOrderBySoNumberQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderMutation,
  useExecuteSalesOrderActionMutation,
} = orderApi;
