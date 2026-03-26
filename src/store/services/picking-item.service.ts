import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { CreatePickingItemPayload, PickingItem, UpdatePickingItemPayload } from "@/types/picking-item";

export type GetPickingItemsParams = {
  soItemId: string;
};

export type UpdatePickingItemArgs = UpdatePickingItemPayload & {
  soItemId: string;
};

const pickingItemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPickingItems: builder.query<ApiResponse<PagedResponse<PickingItem>>, GetPickingItemsParams>({
      query: ({ soItemId }) => ({
        url: "/picking-items",
        method: "GET",
        params: { soItemId },
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

    updatePickingItem: builder.mutation<ApiResponse<PickingItem>, UpdatePickingItemArgs>({
      query: ({ id, soItemId: _soItemId, ...body }) => ({
        url: `/picking-items/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PickingItem" as const, id: arg.id },
        { type: "PickingItem" as const, id: `PARENT-SoItem:${arg.soItemId}` },
      ],
    }),
  }),
});

export const { useGetPickingItemsQuery, useCreatePickingItemMutation, useUpdatePickingItemMutation } = pickingItemApi;

