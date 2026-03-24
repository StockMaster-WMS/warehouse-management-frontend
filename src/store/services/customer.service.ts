import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { Customer } from "@/types/customer";

export type GetCustomersParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  category?: string;
};

function buildCustomersQueryParams(params: GetCustomersParams) {
  const { page = 0, size = 20, sort = "createdAt", sortDir = "desc", keyword, category } = params;

  const query: Record<string, string | number> = {
    page,
    size,
    sort,
    sortDir,
  };
  const k = keyword?.trim();
  if (k) query.keyword = k;
  const c = category?.trim();
  if (c) query.category = c;
  return query;
}

const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<ApiResponse<PagedResponse<Customer>>, GetCustomersParams>({
      query: (params) => ({
        url: "/customers",
        method: "GET",
        params: buildCustomersQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<Customer[] | PagedResponse<Customer>>) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [...rows.map((c) => ({ type: "Customer" as const, id: c.id })), { type: "Customer" as const, id: "LIST" }]
          : [{ type: "Customer" as const, id: "LIST" }];
      },
    }),

    deleteCustomer: builder.mutation<ApiResponse<unknown>, string>({
      query: (id) => ({ url: `/customers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),
  }),
});

export const { useGetCustomersQuery, useDeleteCustomerMutation } = customerApi;
