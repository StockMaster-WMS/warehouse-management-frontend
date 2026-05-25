import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  CreateReturnRequestPayload,
  DispositionReturnPayload,
  ReceiveReturnPayload,
  ReturnLine,
  ReturnReason,
  ReturnReport,
  ReturnRequest,
  ReturnSourceType,
  ReturnStatus,
  ReturnType,
  SupplierReturnLocation,
  SupplierReturnProduct,
} from "@/types/returns";
import type { Location } from "@/types/location";

export type GetReturnRequestsParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: ReturnStatus | "";
  reason?: ReturnReason | "";
  returnType?: ReturnType | "";
  sourceType?: ReturnSourceType | "";
  warehouseId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type GetReturnReportParams = {
  warehouseId?: string;
  returnType?: ReturnType | "";
  createdFrom?: string;
  createdTo?: string;
};

export type GetReturnLocationsParams = {
  warehouseId: string;
  condition?: string;
};

export type GetSupplierReturnProductsParams = {
  warehouseId: string;
  supplierId: string;
  keyword?: string;
};

export type GetSupplierReturnLocationsParams = {
  warehouseId: string;
  supplierId: string;
  productId: string;
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
    returnType,
    sourceType,
    warehouseId,
    createdFrom,
    createdTo,
  } = params;

  const query: Record<string, string | number> = { page, size, sort, sortDir };
  if (keyword?.trim()) query.keyword = keyword.trim();
  if (status) query.status = status;
  if (reason) query.reason = reason;
  if (returnType) query.returnType = returnType;
  else if (sourceType && sourceType !== "INTERNAL") query.returnType = sourceType;
  if (warehouseId?.trim()) query.warehouseId = warehouseId.trim();
  if (createdFrom) query.createdFrom = createdFrom;
  if (createdTo) query.createdTo = createdTo;
  return query;
}

function buildReportQueryParams(params: GetReturnReportParams = {}) {
  const query: Record<string, string> = {};
  if (params.warehouseId?.trim()) query.warehouseId = params.warehouseId.trim();
  if (params.returnType) query.returnType = params.returnType;
  if (params.createdFrom) query.createdFrom = params.createdFrom;
  if (params.createdTo) query.createdTo = params.createdTo;
  return query;
}

type BackendRmaItem = Partial<ReturnLine> & {
  id: string;
  productId: string;
  salesOrderItemId?: string | null;
  expectedQty: number;
  receivedQty?: number | null;
  remainingQty?: number | null;
  notes?: string | null;
};

export type CustomerReturnReceiptSummary = {
  id: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  status: string;
  createdAt?: string | null;
  totalShippedQty: number;
  totalReturnableQty: number;
};

export type CustomerReturnReceiptItem = {
  salesOrderItemId: string;
  productId: string;
  productSku: string;
  productName: string;
  shippedQty: number;
  alreadyReturnedQty: number;
  returnableQty: number;
};

export type CustomerReturnReceiptDetails = CustomerReturnReceiptSummary & {
  items: CustomerReturnReceiptItem[];
};

type BackendRmaResponse = Omit<Partial<ReturnRequest>, "lines"> & {
  returnType?: ReturnType | null;
  sourceType?: ReturnSourceType | null;
  salesOrderId?: string | null;
  items?: BackendRmaItem[];
};

function normalizeReturnLine(
  item: BackendRmaItem | ReturnLine,
  defaultReason?: ReturnReason,
): ReturnLine {
  return {
    id: item.id,
    productId: item.productId,
    salesOrderItemId: item.salesOrderItemId ?? null,
    productSku: item.productSku ?? null,
    productName: item.productName ?? null,
    expectedQty: Number(item.expectedQty ?? 0),
    receivedQty: Number(item.receivedQty ?? 0),
    remainingQty:
      item.remainingQty != null
        ? Number(item.remainingQty)
        : Math.max(0, Number(item.expectedQty ?? 0) - Number(item.receivedQty ?? 0)),
    receivedLocationId: item.receivedLocationId ?? null,
    receivedLocationCode: item.receivedLocationCode ?? null,
    returnLocationId: item.returnLocationId ?? null,
    returnLocationCode: item.returnLocationCode ?? null,
    acceptedQty: item.acceptedQty,
    rejectedQty: item.rejectedQty,
    reason: item.reason ?? defaultReason,
    disposition: item.disposition ?? null,
    note: item.note ?? item.notes ?? null,
    notes: item.notes ?? item.note ?? null,
    lotNumber: item.lotNumber ?? null,
    condition: item.condition ?? null,
    dispositionAction: item.dispositionAction ?? null,
    dispositionLocationId: item.dispositionLocationId ?? null,
    dispositionLocationCode: item.dispositionLocationCode ?? null,
    dispositionAt: item.dispositionAt ?? null,
    dispositionBy: item.dispositionBy ?? null,
    dispositionNote: item.dispositionNote ?? null,
    supplierReturnRmaId: item.supplierReturnRmaId ?? null,
  };
}

function normalizeReturnRequest(raw: BackendRmaResponse | ReturnRequest): ReturnRequest {
  const reason = (raw.reason ?? "CUSTOMER_RETURN") as ReturnReason;
  const backendItems = "items" in raw ? raw.items : undefined;
  const frontendLines = "lines" in raw ? raw.lines : undefined;
  const returnType = (raw.returnType ?? raw.sourceType ?? "CUSTOMER") as ReturnType;
  const lines = (frontendLines ?? backendItems ?? []).map((line) =>
    normalizeReturnLine(line, reason),
  );

  return {
    ...raw,
    id: raw.id ?? "",
    rmaNumber: raw.rmaNumber ?? raw.id ?? "",
    returnType,
    sourceType: raw.sourceType ?? returnType,
    status: (raw.status ?? "REQUESTED") as ReturnStatus,
    reason,
    salesOrderId: raw.salesOrderId ?? raw.orderId ?? null,
    orderId: raw.orderId ?? raw.salesOrderId ?? null,
    orderNumber: raw.orderNumber ?? null,
    totalExpectedQty:
      raw.totalExpectedQty ?? lines.reduce((sum, line) => sum + Number(line.expectedQty ?? 0), 0),
    totalReceivedQty:
      raw.totalReceivedQty ?? lines.reduce((sum, line) => sum + Number(line.receivedQty ?? 0), 0),
    totalRemainingQty:
      raw.totalRemainingQty ?? lines.reduce((sum, line) => sum + Number(line.remainingQty ?? 0), 0),
    lines,
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
  overrideExisting: true,
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
      query: (body) => {
        if (body.returnType === "SUPPLIER") {
          return {
            url: "/rma/supplier",
            method: "POST",
            data: {
              returnType: "SUPPLIER",
              supplierId: body.supplierId,
              warehouseId: body.warehouseId,
              reason: body.reason,
              items: body.lines.map((line) => ({
                productId: line.productId,
                expectedQty: line.expectedQty,
                lotNumber: line.lotNumber?.trim() || "",
                locationId: line.locationId,
              })),
            },
          };
        }

        return {
          url: "/rma/customer",
          method: "POST",
          data: {
            returnType: "CUSTOMER",
            customerId: body.customerId,
            salesOrderId: body.salesOrderId || body.orderId,
            customerName: body.customerName,
            warehouseId: body.warehouseId,
            reason: body.reason,
            items: body.lines.map((line) => ({
              productId: line.productId,
              salesOrderItemId: line.salesOrderItemId || undefined,
              expectedQty: line.expectedQty,
              lotNumber: line.lotNumber?.trim() || "",
            })),
          },
        };
      },
      transformResponse: normalizeReturnResponse,
      invalidatesTags: [{ type: "ReturnRequest", id: "LIST" }],
    }),

    getReturnableReceiptsByCustomer: builder.query<
      ApiResponse<CustomerReturnReceiptSummary[]>,
      string
    >({
      query: (customerId) => ({
        url: `/v1/receipts/out/by-customer/${customerId}`,
        method: "GET",
      }),
    }),

    getReturnableReceiptDetails: builder.query<
      ApiResponse<CustomerReturnReceiptDetails>,
      string
    >({
      query: (id) => ({
        url: `/v1/receipts/out/${id}/details`,
        method: "GET",
      }),
    }),

    getReturnLocations: builder.query<ApiResponse<Location[]>, GetReturnLocationsParams>({
      query: ({ warehouseId, condition }) => ({
        url: "/rma/return-locations",
        method: "GET",
        params: {
          warehouseId,
          ...(condition?.trim() ? { condition: condition.trim() } : {}),
        },
      }),
      transformResponse: (response: ApiResponse<Location[]> | Location[]) =>
        Array.isArray(response)
          ? { success: true, message: "OK", data: response, timestamp: new Date().toISOString() }
          : response,
      providesTags: (_result, _error, arg) => [
        { type: "Location" as const, id: `RMA-${arg.warehouseId}-${arg.condition || "QUARANTINE"}` },
      ],
    }),

    getSupplierReturnProducts: builder.query<
      ApiResponse<SupplierReturnProduct[]>,
      GetSupplierReturnProductsParams
    >({
      query: ({ warehouseId, supplierId, keyword }) => ({
        url: "/rma/supplier-return/products",
        method: "GET",
        params: {
          warehouseId,
          supplierId,
          ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
        },
      }),
      transformResponse: (response: ApiResponse<SupplierReturnProduct[]> | SupplierReturnProduct[]) =>
        Array.isArray(response)
          ? { success: true, message: "OK", data: response, timestamp: new Date().toISOString() }
          : response,
      providesTags: (_result, _error, arg) => [
        { type: "ReturnRequest" as const, id: `SUPPLIER-PRODUCTS-${arg.warehouseId}-${arg.supplierId}` },
      ],
    }),

    getSupplierReturnLocations: builder.query<
      ApiResponse<SupplierReturnLocation[]>,
      GetSupplierReturnLocationsParams
    >({
      query: ({ warehouseId, supplierId, productId }) => ({
        url: "/rma/supplier-return/locations",
        method: "GET",
        params: { warehouseId, supplierId, productId },
      }),
      transformResponse: (response: ApiResponse<SupplierReturnLocation[]> | SupplierReturnLocation[]) =>
        Array.isArray(response)
          ? { success: true, message: "OK", data: response, timestamp: new Date().toISOString() }
          : response,
      providesTags: (_result, _error, arg) => [
        { type: "ReturnRequest" as const, id: `SUPPLIER-LOCATIONS-${arg.warehouseId}-${arg.supplierId}-${arg.productId}` },
      ],
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

    dispositionReturnItem: builder.mutation<
      ApiResponse<ReturnRequest>,
      { rmaId: string; itemId: string; body: DispositionReturnPayload }
    >({
      query: ({ rmaId, itemId, body }) => ({
        url: `/rma/${rmaId}/items/${itemId}/disposition`,
        method: "POST",
        data: body,
      }),
      transformResponse: normalizeReturnResponse,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ReturnRequest", id: arg.rmaId },
        { type: "ReturnRequest", id: "LIST" },
        { type: "Stock", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    approveReturnRequest: builder.mutation<ApiResponse<ReturnRequest>, string>({
      query: (id) => ({ url: `/rma/${id}/approve`, method: "POST" }),
      transformResponse: normalizeReturnResponse,
      invalidatesTags: (_r, _e, id) => [
        { type: "ReturnRequest", id },
        { type: "ReturnRequest", id: "LIST" },
        { type: "Stock", id: "LIST" },
      ],
    }),

    rejectReturnRequest: builder.mutation<ApiResponse<ReturnRequest>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/rma/${id}/reject`,
        method: "POST",
        data: { reason },
      }),
      transformResponse: normalizeReturnResponse,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ReturnRequest", id: arg.id },
        { type: "ReturnRequest", id: "LIST" },
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

    cancelReturnRequest: builder.mutation<ApiResponse<ReturnRequest>, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/rma/${id}/cancel`,
        method: "POST",
        data: reason?.trim() ? { reason: reason.trim() } : undefined,
      }),
      transformResponse: normalizeReturnResponse,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ReturnRequest", id: arg.id },
        { type: "ReturnRequest", id: "LIST" },
      ],
    }),

    getReturnReport: builder.query<ApiResponse<ReturnReport>, GetReturnReportParams | void>({
      query: (params) => ({
        url: "/rma/report",
        method: "GET",
        params: buildReportQueryParams(params ?? {}),
      }),
      providesTags: [{ type: "ReturnRequest" as const, id: "REPORT" }],
    }),
  }),
});

export const {
  useGetReturnRequestsQuery,
  useGetReturnRequestByIdQuery,
  useCreateReturnRequestMutation,
  useGetReturnableReceiptsByCustomerQuery,
  useGetReturnableReceiptDetailsQuery,
  useGetReturnLocationsQuery,
  useGetSupplierReturnProductsQuery,
  useLazyGetSupplierReturnLocationsQuery,
  useReceiveReturnMutation,
  useDispositionReturnItemMutation,
  useApproveReturnRequestMutation,
  useRejectReturnRequestMutation,
  useCloseReturnRequestMutation,
  useCancelReturnRequestMutation,
  useGetReturnReportQuery,
} = returnApi;
