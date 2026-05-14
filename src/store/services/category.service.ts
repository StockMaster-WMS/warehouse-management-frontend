import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { Category, CategoryCreatePayload, CategoryUpdatePayload } from "@/types/category";

export type { Category, CategoryCreatePayload, CategoryUpdatePayload } from "@/types/category";

export interface CategoryQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: string;
  keyword?: string;
  isActive?: boolean;
}

const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<ApiResponse<PagedResponse<Category>>, CategoryQueryParams | void>({
      query: (params) => ({ url: "/categories", method: "GET", params: params || { size: 500 } }),
      transformResponse: (r: ApiResponse<Category[] | PagedResponse<Category>>) => normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [...rows.map((c) => ({ type: "Category" as const, id: c.id })), { type: "Category" as const, id: "LIST" }]
          : [{ type: "Category" as const, id: "LIST" }];
      },
    }),
    getCategoryById: builder.query<ApiResponse<Category>, string>({
      query: (id) => ({ url: `/categories/${id}`, method: "GET" }),
      providesTags: (_result, _err, id) => [{ type: "Category" as const, id }],
    }),
    createCategory: builder.mutation<ApiResponse<Category>, CategoryCreatePayload>({
      query: (body) => ({ url: "/categories", method: "POST", data: body }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    updateCategory: builder.mutation<
      ApiResponse<Category>,
      { id: string; body: CategoryUpdatePayload }
    >({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: "PUT", data: body }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
    deleteCategory: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({ url: `/categories/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;

