import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";
import type { Location } from "@/types/location";
import type { LocationOption } from "@/types/purchase-order";

type UpsertLocationPayload = {
  warehouseId: string;
  code?: string;
  name?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  level?: number;
  bin?: string;
  locationType?: string;
  isActive?: boolean;
};

const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocationById: builder.query<ApiResponse<Location>, string>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Location" as const, id }],
    }),
    createLocation: builder.mutation<ApiResponse<LocationOption>, UpsertLocationPayload>({
      query: (body) => ({
        url: "/locations",
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Location" as const, id: "LIST" },
        { type: "Location" as const, id: "WH-ALL" },
        { type: "Location" as const, id: `WH-${arg.warehouseId}` },
      ],
    }),
    updateLocation: builder.mutation<
      ApiResponse<LocationOption>,
      { id: string; body: UpsertLocationPayload }
    >({
      query: ({ id, body }) => ({
        url: `/locations/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Location" as const, id: arg.id },
        { type: "Location" as const, id: "LIST" },
        { type: "Location" as const, id: "WH-ALL" },
        { type: "Location" as const, id: `WH-${arg.body.warehouseId}` },
      ],
    }),
    deleteLocation: builder.mutation<ApiResponse<unknown>, { id: string; warehouseId?: string }>({
      query: ({ id }) => ({
        url: `/locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Location" as const, id: arg.id },
        { type: "Location" as const, id: "LIST" },
        { type: "Location" as const, id: "WH-ALL" },
        ...(arg.warehouseId
          ? [{ type: "Location" as const, id: `WH-${arg.warehouseId}` }]
          : []),
      ],
    }),
  }),
});

export const {
  useLazyGetLocationByIdQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = locationApi;
