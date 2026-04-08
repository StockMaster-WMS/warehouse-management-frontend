import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { CreateSoItemPayload, SoItem, UpdateSoItemPayload } from "@/types/so-item";

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

    getSoItemById: builder.query<ApiResponse<SoItem>, string>({
      query: (id) => ({
        url: `/so-items/${id}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "SoItem" as const, id }],
    }),

    createSoItem: builder.mutation<ApiResponse<SoItem>, CreateSoItemPayload>({
      query: (body) => ({
        url: "/so-items",
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SoItem" as const, id: `PARENT-SalesOrder:${arg.salesOrderId}` },
        { type: "SalesOrder" as const, id: arg.salesOrderId },
        { type: "PickingItem" as const, id: "LIST" },
      ],
    }),

    updateSoItem: builder.mutation<ApiResponse<SoItem>, { id: string; body: UpdateSoItemPayload }>({
      query: ({ id, body }) => ({
        url: `/so-items/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SoItem" as const, id: `PARENT-SalesOrder:${arg.body.salesOrderId}` },
        { type: "SalesOrder" as const, id: arg.body.salesOrderId },
        { type: "PickingItem" as const, id: "LIST" },
      ],
    }),

    deleteSoItem: builder.mutation<ApiResponse<unknown>, { id: string; salesOrderId: string }>({
      query: ({ id }) => ({
        url: `/so-items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SoItem" as const, id: `PARENT-SalesOrder:${arg.salesOrderId}` },
        { type: "SalesOrder" as const, id: arg.salesOrderId },
        { type: "PickingItem" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSoItemsQuery,
  useGetSoItemByIdQuery,
  useLazyGetSoItemByIdQuery,
  useCreateSoItemMutation,
  useUpdateSoItemMutation,
  useDeleteSoItemMutation,
} = soItemApi;

