import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

const dashboardApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV !== "production",
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<ApiResponse<DashboardSummary>, void>({
      query: () => ({
        url: "/dashboard/summary",
        method: "GET",
      }),
      providesTags: [{ type: "Dashboard", id: "SUMMARY" }],
    }),
  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
