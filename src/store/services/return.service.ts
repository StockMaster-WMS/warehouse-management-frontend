import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  CreateReturnRequestPayload,
  ReceiveReturnPayload,
  ReturnReason,
  ReturnLine,
  ReturnRequest,
  ReturnSourceType,
  ReturnStatus,
} from "@/types/returns";

export type GetReturnRequestsParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: ReturnStatus | "";
  reason?: ReturnReason | "";
  sourceType?: ReturnSourceType | "";
  warehouseId?: string;
  createdFrom?: string;
  createdTo?: string;
};

function buildReturnRequestsQueryParams(params: GetReturnRequestsParams) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    keyword,
    status,
    reason,
    sourceType,
    warehouseId,
    createdFrom,
    createdTo,
  } = params;

  const query: Record<string, string | number> = { page, size, sort, sortDir };
  if (keyword?.trim()) query.keyword = keyword.trim();
  if (status) query.status = status;
  if (reason) query.reason = reason;
  if (sourceType) query.sourceType = sourceType;
  if (warehouseId?.trim()) query.warehouseId = warehouseId.trim();
  if (createdFrom) query.createdFrom = createdFrom;
  if (createdTo) query.createdTo = createdTo;
  return query;
}

type BackendRmaItem = {
  id: string;
  productId: string;
  expectedQty: number;
  receivedQty?: number | null;
  receivedLocationId?: string | null;
  lotNumber?: string | null;
  condition?: string | null;
  notes?: string | null;
};

type BackendRmaResponse = Omit<Partial<ReturnRequest>, "lines"> & {
  salesOrderId?: string | null;
  items?: BackendRmaItem[];
};

function isUuid(value: string | null | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function normalizeReturnLine(
  item: BackendRmaItem | ReturnLine,
  defaultReason?: ReturnReason,
): ReturnLine {
  return {
    id: item.id,
    productId: item.productId,
    productSku: "productSku" in item ? item.productSku : null,
    productName: "productName" in item ? item.productName : null,
    expectedQty: Number(item.expectedQty ?? 0),
    receivedQty: Number(item.receivedQty ?? 0),
    receivedLocationId:
      "receivedLocationId" in item ? item.receivedLocationId ?? null : null,
    acceptedQty: "acceptedQty" in item ? item.acceptedQty : undefined,
    rejectedQty: "rejectedQty" in item ? item.rejectedQty : undefined,
    reason: "reason" in item ? item.reason : defaultReason,
    disposition: "disposition" in item ? item.disposition : null,
    note: "note" in item ? item.note : "notes" in item ? item.notes : null,
    lotNumber: item.lotNumber ?? null,
    condition: "condition" in item ? item.condition : null,
  };
}

function normalizeReturnRequest(raw: BackendRmaResponse | ReturnRequest): ReturnRequest {
  const reason = (raw.reason ?? "CUSTOMER_RETURN") as ReturnReason;
  const backendItems = "items" in raw ? raw.items : undefined;
  const frontendLines = "lines" in raw ? raw.lines : undefined;
  const salesOrderId = "salesOrderId" in raw ? raw.salesOrderId : undefined;

  return {
    ...raw,
    id: raw.id ?? "",
    rmaNumber: raw.rmaNumber ?? raw.id ?? "",
    sourceType: raw.sourceType ?? "CUSTOMER",
    status: (raw.status ?? "REQUESTED") as ReturnStatus,
    reason,
    orderId: raw.orderId ?? salesOrderId ?? null,
    orderNumber: raw.orderNumber ?? null,
    lines: (frontendLines ?? backendItems ?? []).map((line) =>
      normalizeReturnLine(line, reason),
    ),
  };
}

function normalizeReturnResponse(
  response: ApiResponse<BackendRmaResponse | ReturnRequest>,
): ApiResponse<ReturnRequest> {
  return {
    ...response,
    data: normalizeReturnRequest(response.data),
  };
}

function normalizeReturnPagedResponse(
  response: ApiResponse<
    Array<BackendRmaResponse | ReturnRequest> | PagedResponse<BackendRmaResponse | ReturnRequest>
  >,
): ApiResponse<PagedResponse<ReturnRequest>> {
  const paged = normalizeApiResponsePaged(response);
  return {
    ...paged,
    data: {
      ...paged.data,
      content: paged.data.content.map(normalizeReturnRequest),
    },
  };
}

const returnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReturnRequests: builder.query<
      ApiResponse<PagedResponse<ReturnRequest>>,
      GetReturnRequestsParams
    >({
      query: (params) => ({
        url: "/rma",
        method: "GET",
        params: buildReturnRequestsQueryParams(params),
      }),
      transformResponse: normalizeReturnPagedResponse,
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [
              ...rows.map((row) => ({
                type: "ReturnRequest" as const,
                id: row.id,
              })),
              { type: "ReturnRequest" as const, id: "LIST" },
            ]
          : [{ type: "ReturnRequest" as const, id: "LIST" }];
      },
    }),

    getReturnRequestById: builder.query<ApiResponse<ReturnRequest>, string>({
      query: (id) => ({ url: `/rma/${id}`, method: "GET" }),
      transformResponse: normalizeReturnResponse,
      providesTags: (_r, _e, id) => [{ type: "ReturnRequest" as const, id }],
    }),

    createReturnRequest: builder.mutation<
      ApiResponse<ReturnRequest>,
      CreateReturnRequestPayload
    >({
      query: (body) => ({
        url: "/rma",
        method: "POST",
        data: {
          salesOrderId: isUuid(body.orderId) ? body.orderId : undefined,
          customerName: body.customerId || undefined,
          warehouseId: body.warehouseId,
          reason: body.reason,
          items: body.lines.map((line) => ({
            productId: line.productId,
            expectedQty: line.expectedQty,
          })),
        },
      }),
      transformResponse: normalizeReturnResponse,
      invalidatesTags: [{ type: "ReturnRequest", id: "LIST" }],
    }),

    receiveReturn: builder.mutation<
      ApiResponse<ReturnRequest>,
      { id: string; body: ReceiveReturnPayload }
    >({
      query: ({ id, body }) => ({
        url: `/rma/${id}/receive`,
        method: "POST",
        data: body,
      }),
      transformResponse: normalizeReturnResponse,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ReturnRequest", id: arg.id },
        { type: "ReturnRequest", id: "LIST" },
        { type: "Stock", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    closeReturnRequest: builder.mutation<ApiResponse<ReturnRequest>, string>({
      query: (id) => ({ url: `/rma/${id}/complete`, method: "POST" }),
      transformResponse: normalizeReturnResponse,
      invalidatesTags: (_r, _e, id) => [
        { type: "ReturnRequest", id },
        { type: "ReturnRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetReturnRequestsQuery,
  useGetReturnRequestByIdQuery,
  useCreateReturnRequestMutation,
  useReceiveReturnMutation,
  useCloseReturnRequestMutation,
} = returnApi;
