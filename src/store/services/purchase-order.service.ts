import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { Product } from "@/types/product";
import type {
  CompletePutawayPayload,
  CreatePoItemPayload,
  CreatePurchaseOrderPayload,
  PatchPutawayTaskPayload,
  PoItem,
  PurchaseOrder,
  PutawayTask,
  ReceivePoItemPayload,
} from "@/types/purchase-order";
import type { Warehouse } from "@/types/warehouse";

type GetPoItemsArgs = { purchaseOrderId: string };
type GetPutawayTasksArgs = { poItemId?: string; status?: string };

const purchaseOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarehousesForPo: builder.query<ApiResponse<PagedResponse<Warehouse>>, { size?: number }>({
      query: ({ size = 50 }) => ({
        url: "/warehouses",
        method: "GET",
        params: { page: 0, size, sort: "createdAt", sortDir: "desc" },
      }),
      transformResponse: (r: ApiResponse<Warehouse[] | PagedResponse<Warehouse>>) => normalizeApiResponsePaged(r),
    }),

    getProductsForPo: builder.query<ApiResponse<PagedResponse<Product>>, { size?: number; keyword?: string }>({
      query: ({ size = 50, keyword }) => ({
        url: "/products",
        method: "GET",
        params: {
          page: 0,
          size,
          sort: "updatedAt",
          ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
        },
      }),
      transformResponse: (r: ApiResponse<Product[] | PagedResponse<Product>>) => normalizeApiResponsePaged(r),
    }),

    getPurchaseOrders: builder.query<
      ApiResponse<PagedResponse<PurchaseOrder>>,
      { page?: number; size?: number }
    >({
      query: ({ page = 0, size = 20 } = {}) => ({
        url: "/purchase-orders",
        method: "GET",
        params: { page, size },
      }),
      transformResponse: (r: ApiResponse<PurchaseOrder[] | PagedResponse<PurchaseOrder>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [...rows.map((p) => ({ type: "PurchaseOrder" as const, id: p.id })), { type: "PurchaseOrder" as const, id: "LIST" }]
          : [{ type: "PurchaseOrder" as const, id: "LIST" }];
      },
    }),

    getPurchaseOrderById: builder.query<ApiResponse<PurchaseOrder>, string>({
      query: (id) => ({ url: `/purchase-orders/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "PurchaseOrder" as const, id }],
    }),

    createPurchaseOrder: builder.mutation<ApiResponse<PurchaseOrder>, CreatePurchaseOrderPayload>({
      query: (body) => {
        const payload: Record<string, unknown> = {
          poNumber: body.poNumber,
          supplierId: body.supplierId,
          warehouseId: body.warehouseId,
          orderDate: body.orderDate,
        };
        if (body.expectedDate?.trim()) payload.expectedDate = body.expectedDate.trim();
        if (body.status?.trim()) payload.status = body.status.trim();
        if (body.totalAmount != null && !Number.isNaN(body.totalAmount)) payload.totalAmount = body.totalAmount;
        return { url: "/purchase-orders", method: "POST", data: payload };
      },
      invalidatesTags: [{ type: "PurchaseOrder", id: "LIST" }],
    }),

    getPoItems: builder.query<ApiResponse<PagedResponse<PoItem>>, GetPoItemsArgs>({
      query: ({ purchaseOrderId }) => ({
        url: "/po-items",
        method: "GET",
        params: { purchaseOrderId },
      }),
      transformResponse: (r: ApiResponse<PoItem[] | PagedResponse<PoItem>>) => normalizeApiResponsePaged(r),
      providesTags: (result, _e, { purchaseOrderId }) => {
        const items = result?.data?.content ?? [];
        return [
          ...items.map((i) => ({ type: "PoItem" as const, id: i.id })),
          { type: "PoItem" as const, id: `PARENT-PurchaseOrder:${purchaseOrderId}` },
        ];
      },
    }),

    createPoItem: builder.mutation<ApiResponse<PoItem>, CreatePoItemPayload>({
      query: (body) => {
        const payload: Record<string, unknown> = {
          purchaseOrderId: body.purchaseOrderId,
          lineNumber: body.lineNumber,
          productId: body.productId,
          productSku: body.productSku,
          orderedQty: body.orderedQty,
        };
        if (body.receivedQty != null) payload.receivedQty = body.receivedQty;
        if (body.unitPrice != null && !Number.isNaN(body.unitPrice)) payload.unitPrice = body.unitPrice;
        return { url: "/po-items", method: "POST", data: payload };
      },
      invalidatesTags: (_r, _e, arg) => [{ type: "PoItem" as const, id: `PARENT-PurchaseOrder:${arg.purchaseOrderId}` }],
    }),

    deletePoItem: builder.mutation<ApiResponse<unknown>, { id: string; purchaseOrderId: string }>({
      query: ({ id }) => ({ url: `/po-items/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, arg) => [{ type: "PoItem" as const, id: `PARENT-PurchaseOrder:${arg.purchaseOrderId}` }],
    }),

    receivePoItem: builder.mutation<ApiResponse<unknown>, ReceivePoItemPayload>({
      query: ({ poItemId, body }) => ({
        url: `/po-items/${poItemId}/receive`,
        method: "POST",
        data: {
          qty: body.qty,
          ...(body.suggestedLocationId?.trim() ? { suggestedLocationId: body.suggestedLocationId.trim() } : {}),
        },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PoItem" as const, id: `PARENT-PurchaseOrder:${arg.purchaseOrderId}` },
        { type: "PutawayTask" as const, id: "LIST" },
      ],
    }),

    getPutawayTasks: builder.query<ApiResponse<PagedResponse<PutawayTask>>, GetPutawayTasksArgs>({
      query: (params) => ({
        url: "/putaway-tasks",
        method: "GET",
        params: {
          ...(params.poItemId?.trim() ? { poItemId: params.poItemId.trim() } : {}),
          ...(params.status?.trim() ? { status: params.status.trim() } : {}),
        },
      }),
      transformResponse: (r: ApiResponse<PutawayTask[] | PagedResponse<PutawayTask>>) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const tasks = result?.data?.content ?? [];
        return [
          ...tasks.map((t) => ({ type: "PutawayTask" as const, id: t.id })),
          { type: "PutawayTask" as const, id: "LIST" },
        ];
      },
    }),

    patchPutawayTask: builder.mutation<ApiResponse<PutawayTask>, PatchPutawayTaskPayload>({
      query: ({ id, body }) => ({
        url: `/putaway-tasks/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PutawayTask", id: arg.id },
        { type: "PutawayTask", id: "LIST" },
      ],
    }),

    completePutawayTask: builder.mutation<ApiResponse<unknown>, CompletePutawayPayload>({
      query: ({ id, body }) => ({
        url: `/putaway-tasks/${id}/complete`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PutawayTask", id: arg.id },
        { type: "PutawayTask", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetWarehousesForPoQuery,
  useGetProductsForPoQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useGetPoItemsQuery,
  useCreatePoItemMutation,
  useDeletePoItemMutation,
  useReceivePoItemMutation,
  useGetPutawayTasksQuery,
  usePatchPutawayTaskMutation,
  useCompletePutawayTaskMutation,
} = purchaseOrderApi;
