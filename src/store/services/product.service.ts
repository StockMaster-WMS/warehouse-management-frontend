
import { baseApi } from "@/store/services/api";
import { Product, UpdateProductPayload } from "@/types/product";
import { ApiResponse, PagedResponse } from "@/types/api";

export type GetProductsParams = {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  categoryId?: string;
  status?: "ACTIVE" | "INACTIVE";
};

function buildProductsQueryParams(params: GetProductsParams) {
  const {
    page = 0,
    size = 20,
    sort = "updatedAt",
    keyword,
    categoryId,
    status,
  } = params;

  const query: Record<string, string | number> = { page, size, sort };
  const k = keyword?.trim();
  if (k) query.keyword = k;
  if (categoryId?.trim()) query.categoryId = categoryId.trim();
  if (status) query.status = status;
  return query;
}

const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ApiResponse<PagedResponse<Product>>, GetProductsParams>({
      query: (params) => ({
        url: "/products",
        method: "GET",
        params: buildProductsQueryParams(params),
      }),
    }),
    getProductById: builder.query<ApiResponse<Product>, string>({
      query: (id) => ({ url: `/products/${id}`, method: "GET" }),
    }),
    updateProduct: builder.mutation<ApiResponse<Product>, UpdateProductPayload>({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        data: body,
      }),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
} = productApi;
