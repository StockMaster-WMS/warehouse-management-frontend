import { baseApi } from "@/store/services/api";
import {
  Product,
  ProductImportResponse,
  UpdateProductPayload,
  CreateProductPayload,
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
  supplierId?: string;
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
    supplierId,
    status,
  } = params;

  const query: Record<string, string | number> = { page, size, sort };
  const k = keyword?.trim();
  if (k) query.keyword = k;
  if (categoryId?.trim()) query.categoryId = categoryId.trim();
  if (warehouseId?.trim()) query.warehouseId = warehouseId.trim();
  if (supplierId?.trim()) query.supplierId = supplierId.trim();
  if (status) query.status = status;
  return query;
}

function buildProductExportParams(params: Omit<GetProductsParams, "page" | "size" | "sort">) {
  const { keyword, categoryId, warehouseId, supplierId, status } = params;
  const query: Record<string, string> = {};
  if (keyword?.trim()) query.keyword = keyword.trim();
  if (categoryId?.trim()) query.categoryId = categoryId.trim();
  if (warehouseId?.trim()) query.warehouseId = warehouseId.trim();
  if (supplierId?.trim()) query.supplierId = supplierId.trim();
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
    getProductsByIds: builder.query<ApiResponse<Product[]>, string[]>({
      queryFn: async (ids, _api, _extraOptions, baseQuery) => {
        const uniqueIds = Array.from(
          ids.reduce((set, id) => {
            const trimmedId = id.trim();
            if (trimmedId) set.add(trimmedId);
            return set;
          }, new Set<string>()),
        );

        if (uniqueIds.length === 0) {
          return {
            data: {
              data: [],
              message: "OK",
              success: true,
              timestamp: new Date().toISOString(),
            },
          };
        }

        const results = await Promise.all(
          uniqueIds.map((id) =>
            baseQuery({
              url: `/products/${encodeURIComponent(id)}`,
              method: "GET",
            }),
          ),
        );
        const failedResult = results.find((result) => result.error);

        if (failedResult?.error) {
          return { error: failedResult.error };
        }

        const products: Product[] = [];
        for (const result of results) {
          const product = (result.data as ApiResponse<Product> | undefined)?.data;
          if (product?.id) products.push(product);
        }

        return {
          data: {
            data: products,
            message: "OK",
            success: true,
            timestamp: new Date().toISOString(),
          },
        };
      },
      providesTags: (_result, _err, ids) =>
        ids.length
          ? ids.map((id) => ({ type: "Product" as const, id }))
          : [{ type: "Product" as const, id: "LIST" }],
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
    createProduct: builder.mutation<ApiResponse<Product>, CreateProductPayload>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    deleteProduct: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, id) => [
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
        params: buildProductExportParams(params),
        responseType: "blob",
      }),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductsByIdsQuery,
  useUpdateProductMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useImportProductsXlsxMutation,
  useExportProductsXlsxMutation,
} = productApi;
