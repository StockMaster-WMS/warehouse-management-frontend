import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";
import type { DashboardPeriod, DashboardSummary } from "@/types/dashboard";

export type DashboardSummaryParams = {
  period?: DashboardPeriod;
  year?: number;
};

export const dashboardApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, DashboardSummaryParams | void>({
      query: (params) => ({
        url: "/dashboard/summary",
        method: "GET",
        params: params
          ? {
              period: params.period,
              year: params.year,
            }
          : undefined,
        timeout: 60000,
      }),
      transformResponse: (response: ApiResponse<DashboardSummary>) => response.data,
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
