import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { Supplier } from "@/types/supplier";

export type GetSuppliersParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: string;
};

function buildSuppliersQueryParams(params: GetSuppliersParams) {
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

const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Sau `transformResponse`, `data` luôn là `PagedResponse<Supplier>` (`content` + meta). */
    getSuppliers: builder.query<ApiResponse<PagedResponse<Supplier>>, GetSuppliersParams>({
      query: (params) => ({
        url: "suppliers",
        method: "GET",
        params: buildSuppliersQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<Supplier[] | PagedResponse<Supplier>>) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [...rows.map((s) => ({ type: "Supplier" as const, id: s.id })), { type: "Supplier" as const, id: "LIST" }]
          : [{ type: "Supplier" as const, id: "LIST" }];
      },
    }),
  }),
});

export const { useGetSuppliersQuery } = supplierApi;
