import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => ({
        url: "/dashboard/summary",
        method: "GET",
        timeout: 60000,
      }),
      transformResponse: (response: ApiResponse<DashboardSummary>) => response.data,
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
