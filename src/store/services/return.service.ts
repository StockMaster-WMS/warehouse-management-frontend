import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  CreateReturnRequestPayload,
  InspectReturnLinePayload,
  ReceiveReturnPayload,
  ReturnReason,
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
  } = params;

  const query: Record<string, string | number> = { page, size, sort, sortDir };
  if (keyword?.trim()) query.keyword = keyword.trim();
  if (status) query.status = status;
  if (reason) query.reason = reason;
  if (sourceType) query.sourceType = sourceType;
  if (warehouseId?.trim()) query.warehouseId = warehouseId.trim();
  return query;
}

const returnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReturnRequests: builder.query<
      ApiResponse<PagedResponse<ReturnRequest>>,
      GetReturnRequestsParams
    >({
      query: (params) => ({
        url: "/returns",
        method: "GET",
        params: buildReturnRequestsQueryParams(params),
      }),
      transformResponse: (
        r: ApiResponse<ReturnRequest[] | PagedResponse<ReturnRequest>>,
      ) => normalizeApiResponsePaged(r),
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
      query: (id) => ({ url: `/returns/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "ReturnRequest" as const, id }],
    }),

    createReturnRequest: builder.mutation<
      ApiResponse<ReturnRequest>,
      CreateReturnRequestPayload
    >({
      query: (body) => ({ url: "/returns", method: "POST", data: body }),
      invalidatesTags: [{ type: "ReturnRequest", id: "LIST" }],
    }),

    receiveReturn: builder.mutation<
      ApiResponse<ReturnRequest>,
      { id: string; body: ReceiveReturnPayload }
    >({
      query: ({ id, body }) => ({
        url: `/returns/${id}/receive`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ReturnRequest", id: arg.id },
        { type: "ReturnRequest", id: "LIST" },
        { type: "Stock", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    inspectReturnLine: builder.mutation<
      ApiResponse<ReturnRequest>,
      InspectReturnLinePayload
    >({
      query: ({ returnId, lineId, ...body }) => ({
        url: `/returns/${returnId}/lines/${lineId}/inspect`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ReturnRequest", id: arg.returnId },
        { type: "ReturnRequest", id: "LIST" },
        { type: "Stock", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    closeReturnRequest: builder.mutation<ApiResponse<ReturnRequest>, string>({
      query: (id) => ({ url: `/returns/${id}/close`, method: "POST" }),
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
  useInspectReturnLineMutation,
  useCloseReturnRequestMutation,
} = returnApi;
