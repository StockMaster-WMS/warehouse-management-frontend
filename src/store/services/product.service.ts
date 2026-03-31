import { baseApi } from "@/store/services/api";
import {
  Product,
  ProductImportResponse,
  UpdateProductPayload,
  normalizeProductImportResponse,
} from "@/types/product";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";

export type GetProductsParams = {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  categoryId?: string;
  warehouseId?: string;
  status?: "ACTIVE" | "INACTIVE";
};

function buildProductsQueryParams(params: GetProductsParams) {
  const {
    page = 0,
    size = 20,
    sort = "updatedAt",
    keyword,
    categoryId,
    warehouseId,
    status,
  } = params;

  const query: Record<string, string | number> = { page, size, sort };
  const k = keyword?.trim();
  if (k) query.keyword = k;
  if (categoryId?.trim()) query.categoryId = categoryId.trim();
  if (warehouseId?.trim()) query.warehouseId = warehouseId.trim();
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
      transformResponse: (r: ApiResponse<Product[] | PagedResponse<Product>>) => normalizeApiResponsePaged(r),
      providesTags: (result) =>
        result?.data?.content?.length
          ? [
              ...result.data.content.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Product" as const, id: "LIST" },
            ]
          : [{ type: "Product" as const, id: "LIST" }],
    }),
    getProductById: builder.query<ApiResponse<Product>, string>({
      query: (id) => ({ url: `/products/${id}`, method: "GET" }),
      providesTags: (_result, _err, id) => [{ type: "Product" as const, id }],
    }),
    updateProduct: builder.mutation<ApiResponse<Product>, UpdateProductPayload>({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    importProductsXlsx: builder.mutation<
      ApiResponse<ProductImportResponse>,
      { file: File; createdBy?: string }
    >({
      query: ({ file, createdBy }) => {
        const formData = new FormData();
        formData.append("file", file);
        const trimmed = createdBy?.trim();
        return {
          url: "/products/import",
          method: "POST",
          data: formData,
          ...(trimmed ? { params: { createdBy: trimmed } } : {}),
          timeout: 120_000,
        };
      },
      transformResponse: (r: ApiResponse<unknown>): ApiResponse<ProductImportResponse> => ({
        ...r,
        data: normalizeProductImportResponse(r.data),
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    exportProductsXlsx: builder.mutation<Blob, Omit<GetProductsParams, "page" | "size" | "sort">>({
      query: (params) => ({
        url: "/products/export",
        method: "GET",
        params: buildProductsQueryParams(params),
        responseType: "blob",
      }),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useImportProductsXlsxMutation,
  useExportProductsXlsxMutation,
} = productApi;
