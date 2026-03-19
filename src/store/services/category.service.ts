import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";

export interface Category {
  id: string;
  code: string;
  name: string;
  parentId?: string | null;
  path?: string;
  level?: number;
  isActive?: boolean;
  createdAt?: string;
}

export type CategoryCreatePayload = {
  name: string;
  parentId?: string | null;
  isActive?: boolean;
};

export type CategoryUpdatePayload = {
  code: string;
  name: string;
  parentId?: string | null;
  path?: string;
  level?: number;
  isActive?: boolean;
};

const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<ApiResponse<Category[]>, void>({
      query: () => ({ url: "/categories", method: "GET" }),
    }),
    getCategoryById: builder.query<ApiResponse<Category>, string>({
      query: (id) => ({ url: `/categories/${id}`, method: "GET" }),
    }),
    createCategory: builder.mutation<ApiResponse<Category>, CategoryCreatePayload>({
      query: (body) => ({ url: "/categories", method: "POST", data: body }),
    }),
    updateCategory: builder.mutation<
      ApiResponse<Category>,
      { id: string; body: CategoryUpdatePayload }
    >({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: "PUT", data: body }),
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} = categoryApi;

