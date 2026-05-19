import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  InboundReceipt,
  CreateInboundReceiptRequest,
} from "@/types/inbound-receipt";

export type GetInboundReceiptsParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: string;
  keyword?: string;
  status?: string;
  purchaseOrderId?: string;
  warehouseId?: string;
  createdFrom?: string;
  createdTo?: string;
};

function buildInboundReceiptsQueryParams(params: GetInboundReceiptsParams) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    keyword,
    status,
    purchaseOrderId,
    warehouseId,
    createdFrom,
    createdTo,
  } = params;

  const query: Record<string, string | number> = { page, size, sort, sortDir };
  const k = keyword?.trim();
  if (k) query.keyword = k;
  const st = status?.trim();
  if (st) query.status = st;
  const poId = purchaseOrderId?.trim();
  if (poId) query.purchaseOrderId = poId;
  const whId = warehouseId?.trim();
  if (whId) query.warehouseId = whId;
  if (createdFrom) query.createdFrom = createdFrom;
  if (createdTo) query.createdTo = createdTo;
  return query;
}

function createIdempotencyKey(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}:${randomId}`;
}

const inboundApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInboundReceipts: builder.query<
      ApiResponse<PagedResponse<InboundReceipt>>,
      GetInboundReceiptsParams
    >({
      query: (params) => ({
        url: "/inbound-receipts",
        method: "GET",
        params: buildInboundReceiptsQueryParams(params),
      }),
      transformResponse: (
        r: ApiResponse<InboundReceipt[] | PagedResponse<InboundReceipt>>,
      ) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [
              ...rows.map((r) => ({
                type: "InboundReceipt" as const,
                id: r.id,
              })),
              { type: "InboundReceipt" as const, id: "LIST" },
            ]
          : [{ type: "InboundReceipt" as const, id: "LIST" }];
      },
    }),

    getInboundReceiptById: builder.query<ApiResponse<InboundReceipt>, string>({
      query: (id) => ({ url: `/inbound-receipts/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "InboundReceipt", id }],
    }),

    getInboundReceiptsByPo: builder.query<
      ApiResponse<InboundReceipt[]>,
      string
    >({
      query: (purchaseOrderId) => ({
        url: `/inbound-receipts/by-po/${purchaseOrderId}`,
        method: "GET",
      }),
      providesTags: (_r, _e, poId) => [
        { type: "InboundReceipt" as const, id: `PO-${poId}` },
      ],
    }),

    createInboundReceipt: builder.mutation<
      ApiResponse<InboundReceipt>,
      CreateInboundReceiptRequest
    >({
      query: (body) => ({
        url: "/inbound-receipts",
        method: "POST",
        data: body,
        headers: {
          "Idempotency-Key": createIdempotencyKey(`inbound-receipt:${body.purchaseOrderId}`),
        },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "InboundReceipt" as const, id: "LIST" },
        { type: "InboundReceipt" as const, id: `PO-${arg.purchaseOrderId}` },
        { type: "PurchaseOrder", id: arg.purchaseOrderId },
        { type: "PurchaseOrder", id: "LIST" },
        { type: "PoItem", id: `PO-${arg.purchaseOrderId}` },
        { type: "PutawayTask", id: "LIST" },
      ],
    }),
    
    getInboundReceiptPrintData: builder.query<
      ApiResponse<import("@/types/inbound-receipt").InboundReceiptPrintResponse>,
      string
    >({
      query: (id) => ({
        url: `/inbound-receipts/${id}/print`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [
        { type: "InboundReceipt" as const, id: `PRINT-${id}` },
      ],
    }),
  }),
});

export const {
  useGetInboundReceiptsQuery,
  useGetInboundReceiptByIdQuery,
  useGetInboundReceiptsByPoQuery,
  useCreateInboundReceiptMutation,
  useLazyGetInboundReceiptPrintDataQuery,
} = inboundApi;
