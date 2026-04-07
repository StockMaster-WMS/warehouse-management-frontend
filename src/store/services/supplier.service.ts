import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  CreateSupplierRequest,
  Supplier,
  UpdateSupplierRequest,
} from "@/types/supplier";

export type GetSuppliersParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  status?: string;
};

function buildSuppliersQueryParams(params: GetSuppliersParams) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    keyword,
    status,
  } = params;

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
    getSuppliers: builder.query<
      ApiResponse<PagedResponse<Supplier>>,
      GetSuppliersParams
    >({
      query: (params) => ({
        url: "/suppliers",
        method: "GET",
        params: buildSuppliersQueryParams(params),
      }),
      transformResponse: (
        r: ApiResponse<Supplier[] | PagedResponse<Supplier>>,
      ) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [
              ...rows.map((s) => ({ type: "Supplier" as const, id: s.id })),
              { type: "Supplier" as const, id: "LIST" },
            ]
          : [{ type: "Supplier" as const, id: "LIST" }];
      },
    }),

    getSupplierById: builder.query<ApiResponse<Supplier>, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Supplier", id }],
    }),

    createSupplier: builder.mutation<
      ApiResponse<Supplier>,
      CreateSupplierRequest
    >({
      query: (body) => ({
        url: "/suppliers",
        method: "POST",
        data: { ...body, status: (body.status ?? "active").toLowerCase() },
      }),
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),

    updateSupplier: builder.mutation<
      ApiResponse<Supplier>,
      { id: string; body: UpdateSupplierRequest }
    >({
      query: ({ id, body }) => ({
        url: `/suppliers/${id}`,
        method: "PUT",
        data: { ...body, status: (body.status ?? "active").toLowerCase() },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Supplier", id: arg.id },
        { type: "Supplier", id: "LIST" },
      ],
    }),

    changeSupplierStatus: builder.mutation<
      ApiResponse<Supplier>,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/suppliers/${id}/status`,
        method: "PATCH",
        params: { status: status.toLowerCase() },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Supplier", id: arg.id },
        { type: "Supplier", id: "LIST" },
      ],
    }),

    deleteSupplier: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useChangeSupplierStatusMutation,
  useDeleteSupplierMutation,
} = supplierApi;
