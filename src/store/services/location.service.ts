import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";
import type { Location } from "@/types/location";

const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocationById: builder.query<ApiResponse<Location>, string>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Location" as const, id }],
    }),
  }),
});

export const { useLazyGetLocationByIdQuery } = locationApi;
