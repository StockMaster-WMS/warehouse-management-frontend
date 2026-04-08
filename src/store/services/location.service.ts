import { baseApi } from "@/store/services/api";
import { normalizeApiResponsePaged, type ApiResponse, type PagedResponse } from "@/types/api";
import type { Location, CreateLocationRequest } from "@/types/location";

export type GetLocationsParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  warehouseId?: string;
  zone?: string;
  keyword?: string;
};

function buildLocationsQueryParams(params: GetLocationsParams) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    warehouseId,
    zone,
    keyword,
  } = params;

  const query: Record<string, string | number> = { page, size, sort, sortDir };
  const wh = warehouseId?.trim();
  if (wh) query.warehouseId = wh;
  const z = zone?.trim();
  if (z) query.zone = z;
  const k = keyword?.trim();
  if (k) query.keyword = k;
  return query;
}

const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocationsList: builder.query<
      ApiResponse<PagedResponse<Location>>,
      GetLocationsParams
    >({
      query: (params) => ({
        url: "/locations",
        method: "GET",
        params: buildLocationsQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<Location[] | PagedResponse<Location>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result) =>
        result?.data?.content?.length
          ? [
              ...result.data.content.map((l) => ({
                type: "Location" as const,
                id: l.id,
              })),
              { type: "Location" as const, id: "LIST" },
            ]
          : [{ type: "Location" as const, id: "LIST" }],
    }),
    getLocationById: builder.query<ApiResponse<Location>, string>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Location" as const, id }],
    }),
    createLocation: builder.mutation<ApiResponse<Location>, CreateLocationRequest>({
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
      ApiResponse<Location>,
      { id: string; body: CreateLocationRequest }
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
    bulkGenerateLocations: builder.mutation<ApiResponse<string>, any>({
      query: (body) => ({
        url: "/locations/bulk-generate",
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Location" as const, id: "LIST" },
        { type: "Location" as const, id: `WH-${arg.warehouseId}` },
      ],
    }),
  }),
});

export const {
  useGetLocationsListQuery,
  useLazyGetLocationByIdQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useBulkGenerateLocationsMutation,
} = locationApi;
