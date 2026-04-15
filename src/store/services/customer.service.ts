import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type {
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
} from "@/types/customer";

export type GetCustomersParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  isActive?: boolean;
};

function buildCustomersQueryParams(params: GetCustomersParams) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    keyword,
    isActive,
  } = params;

  const query: Record<string, string | number | boolean> = {
    page,
    size,
    sort,
    sortDir,
  };
  const k = keyword?.trim();
  if (k) query.keyword = k;
  if (typeof isActive === "boolean") query.isActive = isActive;
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

    getCustomerById: builder.query<ApiResponse<Customer>, string>({
      query: (id) => ({ url: `/customers/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Customer", id }],
    }),

    getCustomerByCode: builder.query<ApiResponse<Customer>, string>({
      query: (code) => ({ url: `/customers/code/${code}`, method: "GET" }),
      providesTags: (result) =>
        result?.data?.id
          ? [{ type: "Customer", id: result.data.id }]
          : [{ type: "Customer", id: "CODE" }],
    }),

    createCustomer: builder.mutation<ApiResponse<Customer>, CreateCustomerRequest>({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),

    updateCustomer: builder.mutation<
      ApiResponse<Customer>,
      { id: string; body: UpdateCustomerRequest }
    >({
      query: ({ id, body }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Customer", id: arg.id },
        { type: "Customer", id: "LIST" },
      ],
    }),

    deleteCustomer: builder.mutation<ApiResponse<string>, string>({
      query: (id) => ({ url: `/customers/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useGetCustomerByCodeQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;
