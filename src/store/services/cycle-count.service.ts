import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  CreateCycleCountPayload,
  CycleCount,
  CycleCountLine,
  CycleCountStatus,
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

type BackendCycleCountItem = {
  id: string;
  productId?: string | null;
  locationId?: string | null;
  lotNumber?: string | null;
  systemQty?: number | null;
  countedQty?: number | null;
  discrepancy?: number | null;
  status?: string | null;
  notes?: string | null;
};

type BackendCycleCount = Omit<Partial<CycleCount>, "lines"> & {
  description?: string | null;
  scheduledAt?: string | null;
  items?: BackendCycleCountItem[];
};

function normalizeCycleCountLine(
  item: BackendCycleCountItem | CycleCountLine,
  cycleCountId: string,
): CycleCountLine {
  return {
    id: item.id,
    cycleCountId,
    productId: item.productId ?? null,
    productSku: "productSku" in item ? item.productSku : null,
    productName: "productName" in item ? item.productName : null,
    locationId: item.locationId ?? null,
    locationCode: "locationCode" in item ? item.locationCode : null,
    lotNumber: item.lotNumber ?? null,
    systemQty: Number(item.systemQty ?? 0),
    countedQty: item.countedQty ?? null,
    varianceQty:
      "varianceQty" in item
        ? item.varianceQty
        : "discrepancy" in item
          ? item.discrepancy
          : null,
    status: (item.status ?? "PENDING") as CycleCountLine["status"],
    note: "note" in item ? item.note : "notes" in item ? item.notes : null,
  };
}

function normalizeCycleCount(raw: BackendCycleCount | CycleCount): CycleCount {
  const id = raw.id ?? "";
  const backendItems = "items" in raw ? raw.items : undefined;
  const frontendLines = "lines" in raw ? raw.lines : undefined;
  const description = "description" in raw ? raw.description : undefined;
  const scheduledAt = "scheduledAt" in raw ? raw.scheduledAt : undefined;

  return {
    ...raw,
    id,
    countNumber: raw.countNumber ?? `CC-${id.slice(0, 8).toUpperCase()}`,
    title: raw.title ?? description ?? null,
    status: (raw.status ?? "PENDING") as CycleCountStatus,
    scope: raw.scope ?? "WAREHOUSE",
    startedAt: raw.startedAt ?? scheduledAt ?? null,
    lines: (frontendLines ?? backendItems ?? []).map((line) =>
      normalizeCycleCountLine(line, id),
    ),
  };
}

function normalizeCycleCountResponse(
  response: ApiResponse<BackendCycleCount | CycleCount>,
): ApiResponse<CycleCount> {
  return {
    ...response,
    data: normalizeCycleCount(response.data),
  };
}

function normalizeCycleCountPagedResponse(
  response: ApiResponse<
    Array<BackendCycleCount | CycleCount> | PagedResponse<BackendCycleCount | CycleCount>
  >,
): ApiResponse<PagedResponse<CycleCount>> {
  const paged = normalizeApiResponsePaged(response);
  return {
    ...paged,
    data: {
      ...paged.data,
      content: paged.data.content.map(normalizeCycleCount),
    },
  };
}

const cycleCountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCycleCounts: builder.query<ApiResponse<PagedResponse<CycleCount>>, GetCycleCountsParams>({
      query: (params) => ({
        url: "/cycle-counts",
        method: "GET",
        params: buildCycleCountsQueryParams(params),
      }),
      transformResponse: normalizeCycleCountPagedResponse,
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
      transformResponse: normalizeCycleCountResponse,
      providesTags: (_r, _e, id) => [{ type: "CycleCount" as const, id }],
    }),

    createCycleCount: builder.mutation<ApiResponse<CycleCount>, CreateCycleCountPayload>({
      query: (body) => ({
        url: "/cycle-counts",
        method: "POST",
        data: {
          warehouseId: body.warehouseId,
          description: body.description || body.title,
          scheduledAt: body.scheduledAt,
          items: body.items ?? [],
        },
      }),
      transformResponse: normalizeCycleCountResponse,
      invalidatesTags: [{ type: "CycleCount", id: "LIST" }],
    }),

    startCycleCount: builder.mutation<ApiResponse<CycleCount>, string>({
      query: (id) => ({ url: `/cycle-counts/${id}/start`, method: "POST" }),
      transformResponse: normalizeCycleCountResponse,
      invalidatesTags: (_r, _e, id) => [
        { type: "CycleCount", id },
        { type: "CycleCount", id: "LIST" },
      ],
    }),

    recordCycleCount: builder.mutation<
      ApiResponse<CycleCount>,
      { id: string; lineId: string; countedQty: number; note?: string }
    >({
      query: ({ id, lineId, countedQty, note }) => ({
        url: `/cycle-counts/${id}/record`,
        method: "POST",
        data: { itemId: lineId, countedQty, notes: note },
      }),
      transformResponse: normalizeCycleCountResponse,
      invalidatesTags: (_r, _e, arg) => [{ type: "CycleCount", id: arg.id }],
    }),

    completeCycleCount: builder.mutation<ApiResponse<CycleCount>, string>({
      query: (id) => ({ url: `/cycle-counts/${id}/complete`, method: "POST" }),
      transformResponse: normalizeCycleCountResponse,
      invalidatesTags: (_r, _e, id) => [
        { type: "CycleCount", id },
        { type: "CycleCount", id: "LIST" },
        { type: "Stock", id: "LIST" },
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
} = cycleCountApi;
