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

    recordCycleCount: builder.mutation<
      ApiResponse<CycleCount>,
      { id: string; results: { productId: string; locationId: string; actualQty: number }[] }
    >({
      query: ({ id, results }) => ({
        url: `/cycle-counts/${id}/record`,
        method: "POST",
        data: { results },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "CycleCount", id: arg.id }],
    }),

    completeCycleCount: builder.mutation<ApiResponse<CycleCount>, string>({
      query: (id) => ({ url: `/cycle-counts/${id}/complete`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CycleCount", id },
        { type: "CycleCount", id: "LIST" },
        { type: "Stock", id: "LIST" },
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
  useRecordCycleCountMutation,
  useCompleteCycleCountMutation,
  useCancelCycleCountMutation,
} = cycleCountApi;
