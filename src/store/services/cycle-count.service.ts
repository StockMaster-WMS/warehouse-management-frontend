import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  CreateCycleCountPayload,
  CycleCount,
  CycleCountStatus,
  SubmitCycleCountLinePayload,
} from "@/types/cycle-count";

export type GetCycleCountsParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: CycleCountStatus | "";
  warehouseId?: string;
};

function buildCycleCountsQueryParams(params: GetCycleCountsParams) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    keyword,
    status,
    warehouseId,
  } = params;
  const query: Record<string, string | number> = { page, size, sort, sortDir };
  if (keyword?.trim()) query.keyword = keyword.trim();
  if (status) query.status = status;
  if (warehouseId?.trim()) query.warehouseId = warehouseId.trim();
  return query;
}

const cycleCountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCycleCounts: builder.query<ApiResponse<PagedResponse<CycleCount>>, GetCycleCountsParams>({
      query: (params) => ({
        url: "/cycle-counts",
        method: "GET",
        params: buildCycleCountsQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<CycleCount[] | PagedResponse<CycleCount>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [
              ...rows.map((count) => ({ type: "CycleCount" as const, id: count.id })),
              { type: "CycleCount" as const, id: "LIST" },
            ]
          : [{ type: "CycleCount" as const, id: "LIST" }];
      },
    }),

    getCycleCountById: builder.query<ApiResponse<CycleCount>, string>({
      query: (id) => ({ url: `/cycle-counts/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "CycleCount" as const, id }],
    }),

    createCycleCount: builder.mutation<ApiResponse<CycleCount>, CreateCycleCountPayload>({
      query: (body) => ({ url: "/cycle-counts", method: "POST", data: body }),
      invalidatesTags: [{ type: "CycleCount", id: "LIST" }],
    }),

    startCycleCount: builder.mutation<ApiResponse<CycleCount>, string>({
      query: (id) => ({ url: `/cycle-counts/${id}/start`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CycleCount", id },
        { type: "CycleCount", id: "LIST" },
      ],
    }),

    submitCycleCountLine: builder.mutation<
      ApiResponse<CycleCount>,
      SubmitCycleCountLinePayload
    >({
      query: ({ cycleCountId, lineId, ...body }) => ({
        url: `/cycle-counts/${cycleCountId}/lines/${lineId}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "CycleCount", id: arg.cycleCountId },
        { type: "CycleCount", id: "LIST" },
      ],
    }),

    approveCycleCount: builder.mutation<ApiResponse<CycleCount>, string>({
      query: (id) => ({ url: `/cycle-counts/${id}/approve`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CycleCount", id },
        { type: "CycleCount", id: "LIST" },
        { type: "Stock", id: "LIST" },
        { type: "StockMovement", id: "LIST" },
      ],
    }),

    cancelCycleCount: builder.mutation<ApiResponse<CycleCount>, string>({
      query: (id) => ({ url: `/cycle-counts/${id}/cancel`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CycleCount", id },
        { type: "CycleCount", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCycleCountsQuery,
  useGetCycleCountByIdQuery,
  useCreateCycleCountMutation,
  useStartCycleCountMutation,
  useSubmitCycleCountLineMutation,
  useApproveCycleCountMutation,
  useCancelCycleCountMutation,
} = cycleCountApi;
