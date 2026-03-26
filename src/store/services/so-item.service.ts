import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { CreateSoItemPayload, SoItem } from "@/types/so-item";

export type GetSoItemsParams = {
  salesOrderId: string;
};

const soItemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSoItems: builder.query<ApiResponse<PagedResponse<SoItem>>, GetSoItemsParams>({
      query: ({ salesOrderId }) => ({
        url: "/so-items",
        method: "GET",
        params: { salesOrderId },
      }),
      transformResponse: (r: ApiResponse<SoItem[] | PagedResponse<SoItem>>) => normalizeApiResponsePaged(r),
      providesTags: (result, _e, arg) => {
        const rows = result?.data?.content ?? [];
        return [
          ...rows.map((i) => ({ type: "SoItem" as const, id: i.id })),
          { type: "SoItem" as const, id: `PARENT-SalesOrder:${arg.salesOrderId}` },
        ];
      },
    }),

    createSoItem: builder.mutation<ApiResponse<SoItem>, CreateSoItemPayload>({
      query: (body) => ({
        url: "/so-items",
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "SoItem" as const, id: `PARENT-SalesOrder:${arg.salesOrderId}` }],
    }),

    deleteSoItem: builder.mutation<ApiResponse<unknown>, { id: string; salesOrderId: string }>({
      query: ({ id }) => ({
        url: `/so-items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "SoItem" as const, id: `PARENT-SalesOrder:${arg.salesOrderId}` }],
    }),
  }),
});

export const { useGetSoItemsQuery, useCreateSoItemMutation, useDeleteSoItemMutation } = soItemApi;

