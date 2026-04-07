import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { CreatePickingItemPayload, PickingItem, UpdatePickingItemPayload } from "@/types/picking-item";

export type GetPickingItemsParams = {
  soItemId?: string;
  status?: string;
  page?: number;
  size?: number;
};

const pickingItemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    reportPickingException: builder.mutation<ApiResponse<PickingItem>, { id: string; soItemId: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/picking-items/${id}/exception`,
        method: "POST",
        data: { reason },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PickingItem" as const, id: arg.id },
        { type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` },
      ],
    }),

    assignPickingTask: builder.mutation<ApiResponse<PickingItem>, { id: string; soItemId: string; assigneeId: string }>({
      query: ({ id, assigneeId }) => ({
        url: `/picking-items/${id}/assign`,
        method: "POST",
        data: { assigneeId },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PickingItem" as const, id: arg.id },
        { type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` },
      ],
    }),

    getPickingItems: builder.query<ApiResponse<PagedResponse<PickingItem>>, GetPickingItemsParams>({
      query: ({ soItemId, status, page = 0, size = 50 }) => ({
        url: "/picking-items",
        method: "GET",
        params: { soItemId, status, page, size },
      }),
      transformResponse: (r: ApiResponse<PickingItem[] | PagedResponse<PickingItem>>) => normalizeApiResponsePaged(r),
      providesTags: (result, _e, arg) => {
        const rows = result?.data?.content ?? [];
        return [
          ...rows.map((p) => ({ type: "PickingItem" as const, id: p.id })),
          { type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` },
        ];
      },
    }),

    createPickingItem: builder.mutation<ApiResponse<PickingItem>, CreatePickingItemPayload>({
      query: (body) => ({
        url: "/picking-items",
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` }],
    }),

    updatePickingItem: builder.mutation<ApiResponse<PickingItem>, UpdatePickingItemPayload>({
      query: ({ id, ...body }) => ({
        url: `/picking-items/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PickingItem" as const, id: arg.id },
        { type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` },
      ],
    }),

    getPickingItemById: builder.query<ApiResponse<PickingItem>, string>({
      query: (id) => ({
        url: `/picking-items/${id}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "PickingItem" as const, id }],
    }),

    deletePickingItem: builder.mutation<ApiResponse<unknown>, { id: string; soItemId: string }>({
      query: ({ id }) => ({
        url: `/picking-items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PickingItem" as const, id: arg.id },
        { type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` },
        { type: "SalesOrder" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPickingItemsQuery,
  useGetPickingItemByIdQuery,
  useLazyGetPickingItemByIdQuery,
  useCreatePickingItemMutation,
  useUpdatePickingItemMutation,
  useDeletePickingItemMutation,
  useReportPickingExceptionMutation,
  useAssignPickingTaskMutation,
} = pickingItemApi;

