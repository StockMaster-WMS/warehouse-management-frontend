import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";
import type { ReportSummary, RevenueTrend, TopSku } from "@/types/report";

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReportSummary: builder.query<ReportSummary, void>({
      query: () => ({
        url: "/reports/summary",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<ReportSummary>) => response.data,
      providesTags: ["Report"],
    }),
    getRevenueTrend: builder.query<RevenueTrend[], { days: number }>({
      query: ({ days }) => ({
        url: "/reports/revenue-trend",
        method: "GET",
        params: { days },
      }),
      transformResponse: (response: ApiResponse<RevenueTrend[]>) => response.data,
      providesTags: ["Report"],
    }),
    getTopSkus: builder.query<TopSku[], { limit: number }>({
      query: ({ limit }) => ({
        url: "/reports/top-skus",
        method: "GET",
        params: { limit },
      }),
      transformResponse: (response: ApiResponse<TopSku[]>) => response.data,
      providesTags: ["Report"],
    }),
    exportInventoryReport: builder.query<Blob, void>({
      query: () => ({
        url: "/reports/inventory/export",
        method: "GET",
        responseType: "blob",
      }),
    }),
  }),
});

export const { 
  useGetReportSummaryQuery, 
  useGetRevenueTrendQuery, 
  useGetTopSkusQuery,
  useLazyExportInventoryReportQuery
} = reportApi;
