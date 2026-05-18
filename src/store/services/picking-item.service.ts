import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { CreatePickingItemPayload, PickingItem, UpdatePickingItemPayload } from "@/types/picking-item";

export type GetPickingItemsParams = {
  soItemId?: string;
  status?: string;
  page?: number;
  size?: number;
  createdFrom?: string;
  createdTo?: string;
};

const pickingItemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPickingItems: builder.query<ApiResponse<PagedResponse<PickingItem>>, GetPickingItemsParams>({
      query: ({ soItemId, status, page = 0, size = 50, createdFrom, createdTo }) => ({
        url: "/picking-items",
        method: "GET",
        params: { soItemId, status, page, size, createdFrom, createdTo },
      }),
      transformResponse: (r: ApiResponse<PickingItem[] | PagedResponse<PickingItem>>) => normalizeApiResponsePaged(r),
      providesTags: (result, _e, arg) => {
        const rows = result?.data?.content ?? [];
        return [
          ...rows.map((p) => ({ type: "PickingItem" as const, id: p.id })),
          { type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` },
          { type: "PickingItem" as const, id: "LIST" },
        ];
      },
    }),

    createPickingItem: builder.mutation<ApiResponse<PickingItem>, CreatePickingItemPayload>({
      query: (body) => ({
        url: "/picking-items",
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` },
        { type: "PickingItem" as const, id: "LIST" },
      ],
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
        { type: "PickingItem" as const, id: "LIST" },
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
        { type: "PickingItem" as const, id: "LIST" },
        { type: "SalesOrder" as const, id: "LIST" },
      ],
    }),

    reportPickingException: builder.mutation<ApiResponse<PickingItem>, { id: string; soItemId?: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/picking-items/${id}/exception`,
        method: "POST",
        data: { reason },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PickingItem" as const, id: arg.id },
        ...(arg.soItemId ? [{ type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` }] : []),
        { type: "PickingItem" as const, id: "LIST" },
      ],
    }),

    assignPickingTask: builder.mutation<ApiResponse<PickingItem>, { id: string; soItemId?: string; assigneeId: string }>({
      query: ({ id, assigneeId }) => ({
        url: `/picking-items/${id}/assign`,
        method: "POST",
        data: { assigneeId },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PickingItem" as const, id: arg.id },
        ...(arg.soItemId ? [{ type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` }] : []),
        { type: "PickingItem" as const, id: "LIST" },
      ],
    }),

    completeMobilePicking: builder.mutation<ApiResponse<PickingItem>, string>({
      query: (id) => ({
        url: `/picking-items/${id}/complete-mobile`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "PickingItem" as const, id },
        { type: "PickingItem" as const, id: "LIST" },
        { type: "SalesOrder" as const, id: "LIST" },
        { type: "Stock" as const, id: "LIST" },
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
  useCompleteMobilePickingMutation,
} = pickingItemApi;

