import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type { Product } from "@/types/product";
import type {
  CompletePutawayPayload,
  CreatePoItemPayload,
  CreatePurchaseOrderPayload,
  LocationOption,
  PatchPutawayTaskPayload,
  PoItem,
  PurchaseOrder,
  PurchaseOrderDetail,
  PutawayTask,
  UpdatePoItemPayload,
  UpdatePurchaseOrderPayload,
} from "@/types/purchase-order";
import type { Warehouse } from "@/types/warehouse";

type GetPoItemsArgs = {
  purchaseOrderId?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: string;
  keyword?: string;
};
type GetPutawayTasksArgs = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: string;
  poItemId?: string;
  status?: string;
};
type GetPurchaseOrdersArgs = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: string;
  keyword?: string;
  status?: string;
  supplierId?: string;
  warehouseId?: string;
};

type GetLocationsArgs = { warehouseId?: string };

function asNumber(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizePoDetail(raw: unknown): PurchaseOrderDetail {
  const data = (raw ?? {}) as Record<string, unknown>;
  const purchaseOrder = (data.purchaseOrder ??
    data.po ??
    data.header ??
    data) as PurchaseOrder;
  const itemsRaw = data.items ?? data.poItems ?? data.lines ?? [];
  const tasksRaw = data.putawayTasks ?? data.tasks ?? [];
  const items = Array.isArray(itemsRaw) ? (itemsRaw as PoItem[]) : [];
  const putawayTasks = Array.isArray(tasksRaw)
    ? (tasksRaw as PutawayTask[])
    : [];

  const progressRaw = (data.progress ?? {}) as Record<string, unknown>;
  const totalOrderedQty =
    progressRaw.totalOrderedQty != null
      ? asNumber(progressRaw.totalOrderedQty)
      : items.reduce((sum, item) => sum + asNumber(item.orderedQty), 0);
  const totalReceivedQty =
    progressRaw.totalReceivedQty != null
      ? asNumber(progressRaw.totalReceivedQty)
      : items.reduce((sum, item) => sum + asNumber(item.receivedQty), 0);
  const fullyReceived =
    typeof progressRaw.fullyReceived === "boolean"
      ? progressRaw.fullyReceived
      : totalOrderedQty > 0 && totalReceivedQty >= totalOrderedQty;

  return {
    purchaseOrder,
    items,
    putawayTasks,
    progress: {
      totalOrderedQty,
      totalReceivedQty,
      fullyReceived,
    },
  };
}

function normalizeLocationList(raw: unknown): LocationOption[] {
  if (Array.isArray(raw)) return raw as LocationOption[];
  if (raw && typeof raw === "object") {
    const data = raw as Record<string, unknown>;
    if (Array.isArray(data.content)) return data.content as LocationOption[];
    if (Array.isArray(data.items)) return data.items as LocationOption[];
  }
  return [];
}

const purchaseOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarehousesForPo: builder.query<
      ApiResponse<PagedResponse<Warehouse>>,
      { size?: number }
    >({
      query: ({ size = 50 }) => ({
        url: "/warehouses",
        method: "GET",
        params: { page: 0, size, sort: "createdAt", sortDir: "desc" },
      }),
      transformResponse: (
        r: ApiResponse<Warehouse[] | PagedResponse<Warehouse>>,
      ) => normalizeApiResponsePaged(r),
    }),

    getProductsForPo: builder.query<
      ApiResponse<PagedResponse<Product>>,
      { size?: number; keyword?: string }
    >({
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
      transformResponse: (r: ApiResponse<Product[] | PagedResponse<Product>>) =>
        normalizeApiResponsePaged(r),
    }),

    getPurchaseOrders: builder.query<
      ApiResponse<PagedResponse<PurchaseOrder>>,
      GetPurchaseOrdersArgs
    >({
      query: ({
        page = 0,
        size = 20,
        sort = "createdAt",
        sortDir = "desc",
        keyword,
        status,
        supplierId,
        warehouseId,
      } = {}) => {
        const params: Record<string, string | number> = {
          page,
          size,
          sort,
          sortDir,
        };
        if (keyword?.trim()) params.keyword = keyword.trim();
        if (status?.trim()) params.status = status.trim();
        if (supplierId?.trim()) params.supplierId = supplierId.trim();
        if (warehouseId?.trim()) params.warehouseId = warehouseId.trim();
        return {
          url: "/purchase-orders",
          method: "GET",
          params,
        };
      },
      transformResponse: (
        r: ApiResponse<PurchaseOrder[] | PagedResponse<PurchaseOrder>>,
      ) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [
              ...rows.map((p) => ({
                type: "PurchaseOrder" as const,
                id: p.id,
              })),
              { type: "PurchaseOrder" as const, id: "LIST" },
            ]
          : [{ type: "PurchaseOrder" as const, id: "LIST" }];
      },
    }),

    getPurchaseOrderById: builder.query<ApiResponse<PurchaseOrder>, string>({
      query: (id) => ({ url: `/purchase-orders/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "PurchaseOrder" as const, id }],
    }),

    getPurchaseOrderDetail: builder.query<
      ApiResponse<PurchaseOrderDetail>,
      string
    >({
      query: (id) => ({ url: `/purchase-orders/${id}/detail`, method: "GET" }),
      transformResponse: (
        r: ApiResponse<unknown>,
      ): ApiResponse<PurchaseOrderDetail> => ({
        ...r,
        data: normalizePoDetail(r.data),
      }),
      providesTags: (_r, _e, id) => [
        { type: "PurchaseOrder", id },
        { type: "PoItem", id: `PO-${id}` },
        { type: "PutawayTask", id: `PO-${id}` },
      ],
    }),

    createPurchaseOrder: builder.mutation<
      ApiResponse<PurchaseOrder>,
      CreatePurchaseOrderPayload
    >({
      query: (body) => {
        const payload: Record<string, unknown> = {
          supplierId: body.supplierId,
          warehouseId: body.warehouseId,
          orderDate: body.orderDate,
        };
        if (body.expectedDate?.trim())
          payload.expectedDate = body.expectedDate.trim();
        if (body.totalAmount != null && !Number.isNaN(body.totalAmount))
          payload.totalAmount = body.totalAmount;
        return { url: "/purchase-orders", method: "POST", data: payload };
      },
      invalidatesTags: [{ type: "PurchaseOrder", id: "LIST" }],
    }),

    updatePurchaseOrder: builder.mutation<
      ApiResponse<PurchaseOrder>,
      UpdatePurchaseOrderPayload
    >({
      query: ({ id, body }) => ({
        url: `/purchase-orders/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PurchaseOrder", id: arg.id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    deletePurchaseOrder: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    approvePurchaseOrder: builder.mutation<ApiResponse<PurchaseOrder>, string>({
      query: (id) => ({
        url: `/purchase-orders/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
        { type: "PoItem", id: `PO-${id}` },
      ],
    }),

    cancelPurchaseOrder: builder.mutation<ApiResponse<PurchaseOrder>, string>({
      query: (id) => ({
        url: `/purchase-orders/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    getPoItems: builder.query<
      ApiResponse<PagedResponse<PoItem>>,
      GetPoItemsArgs
    >({
      query: ({
        purchaseOrderId,
        page = 0,
        size = 100,
        sort = "lineNumber",
        sortDir = "asc",
        keyword,
      }) => {
        const params: Record<string, string | number> = {
          page,
          size,
          sort,
          sortDir,
        };
        if (purchaseOrderId?.trim())
          params.purchaseOrderId = purchaseOrderId.trim();
        if (keyword?.trim()) params.keyword = keyword.trim();
        return {
          url: "/po-items",
          method: "GET",
          params,
        };
      },
      transformResponse: (r: ApiResponse<PoItem[] | PagedResponse<PoItem>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result, _e, { purchaseOrderId }) => {
        const items = result?.data?.content ?? [];
        return [
          ...items.map((i) => ({ type: "PoItem" as const, id: i.id })),
          {
            type: "PoItem" as const,
            id: `PARENT-PurchaseOrder:${purchaseOrderId}`,
          },
        ];
      },
    }),

    getPoItemById: builder.query<ApiResponse<PoItem>, string>({
      query: (id) => ({ url: `/po-items/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "PoItem", id }],
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
        if (body.unitPrice != null && !Number.isNaN(body.unitPrice))
          payload.unitPrice = body.unitPrice;
        return { url: "/po-items", method: "POST", data: payload };
      },
      invalidatesTags: (_r, _e, arg) => [
        {
          type: "PoItem" as const,
          id: `PARENT-PurchaseOrder:${arg.purchaseOrderId}`,
        },
        { type: "PurchaseOrder", id: arg.purchaseOrderId },
      ],
    }),

    updatePoItem: builder.mutation<ApiResponse<PoItem>, UpdatePoItemPayload>({
      query: ({ id, body }) => ({
        url: `/po-items/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PoItem" as const, id: arg.id },
      ],
    }),

    deletePoItem: builder.mutation<
      ApiResponse<unknown>,
      { id: string; purchaseOrderId: string }
    >({
      query: ({ id }) => ({ url: `/po-items/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, arg) => [
        {
          type: "PoItem" as const,
          id: `PARENT-PurchaseOrder:${arg.purchaseOrderId}`,
        },
        { type: "PurchaseOrder", id: arg.purchaseOrderId },
      ],
    }),

    getPutawayTasks: builder.query<
      ApiResponse<PagedResponse<PutawayTask>>,
      GetPutawayTasksArgs
    >({
      query: ({
        page = 0,
        size = 20,
        sort = "id",
        sortDir = "desc",
        poItemId,
        status,
      }) => {
        const params: Record<string, string | number> = {
          page,
          size,
          sort,
          sortDir,
        };
        if (poItemId?.trim()) params.poItemId = poItemId.trim();
        if (status?.trim()) params.status = status.trim();
        return {
          url: "/putaway-tasks",
          method: "GET",
          params,
        };
      },
      transformResponse: (
        r: ApiResponse<PutawayTask[] | PagedResponse<PutawayTask>>,
      ) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const tasks = result?.data?.content ?? [];
        return [
          ...tasks.map((t) => ({ type: "PutawayTask" as const, id: t.id })),
          { type: "PutawayTask" as const, id: "LIST" },
        ];
      },
    }),

    getPutawayTaskById: builder.query<ApiResponse<PutawayTask>, string>({
      query: (id) => ({ url: `/putaway-tasks/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "PutawayTask", id }],
    }),

    patchPutawayTask: builder.mutation<
      ApiResponse<PutawayTask>,
      PatchPutawayTaskPayload
    >({
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

    completePutawayTask: builder.mutation<
      ApiResponse<unknown>,
      CompletePutawayPayload
    >({
      query: ({ id, body }) => ({
        url: `/putaway-tasks/${id}/complete`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PutawayTask", id: arg.id },
        { type: "PutawayTask", id: "LIST" },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    getLocations: builder.query<
      ApiResponse<LocationOption[]>,
      GetLocationsArgs
    >({
      query: ({ warehouseId } = {}) => {
        const params: Record<string, string | number> = { page: 0, size: 200 };
        if (warehouseId?.trim()) params.warehouseId = warehouseId.trim();
        return {
          url: "/locations",
          method: "GET",
          params,
        };
      },
      transformResponse: (
        r: ApiResponse<unknown>,
      ): ApiResponse<LocationOption[]> => ({
        ...r,
        data: normalizeLocationList(r.data),
      }),
      providesTags: (_result, _error, arg) => [
        { type: "Location", id: `WH-${arg.warehouseId}` },
      ],
    }),
  }),
});

export const {
  useGetWarehousesForPoQuery,
  useGetProductsForPoQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useGetPurchaseOrderDetailQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useGetPoItemsQuery,
  useGetPoItemByIdQuery,
  useCreatePoItemMutation,
  useUpdatePoItemMutation,
  useDeletePoItemMutation,
  useGetPutawayTasksQuery,
  useGetPutawayTaskByIdQuery,
  usePatchPutawayTaskMutation,
  useCompletePutawayTaskMutation,
  useGetLocationsQuery,
} = purchaseOrderApi;
