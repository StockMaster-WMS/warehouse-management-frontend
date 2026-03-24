import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { InboundReceipt } from "@/types/inbound-receipt";

export type GetInboundReceiptsParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: string;
};

function buildInboundReceiptsQueryParams(params: GetInboundReceiptsParams) {
  const { page = 0, size = 20, sort = "createdAt", sortDir = "desc", keyword, status } = params;

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
  return query;
}

const inboundApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInboundReceipts: builder.query<ApiResponse<PagedResponse<InboundReceipt>>, GetInboundReceiptsParams>({
      query: (params) => ({
        url: "/inbound-receipts",
        method: "GET",
        params: buildInboundReceiptsQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<InboundReceipt[] | PagedResponse<InboundReceipt>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [
              ...rows.map((r) => ({ type: "InboundReceipt" as const, id: r.id })),
              { type: "InboundReceipt" as const, id: "LIST" },
            ]
          : [{ type: "InboundReceipt" as const, id: "LIST" }];
      },
    }),
  }),
});

export const { useGetInboundReceiptsQuery } = inboundApi;
