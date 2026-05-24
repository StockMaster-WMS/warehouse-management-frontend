import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";
import type { DashboardPeriod } from "@/types/dashboard";
import type { ReportSummary, RevenueTrend, TopSku } from "@/types/report";

export interface ReportSummaryParams {
  period?: DashboardPeriod;
  year?: number;
  warehouseId?: string;
  fromDate?: string;
  toDate?: string;
}

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReportSummary: builder.query<ReportSummary, ReportSummaryParams | void>({
      query: (params) => ({
        url: "/reports/summary",
        method: "GET",
        params,
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
    exportReportSummary: builder.query<Blob, ReportSummaryParams | void>({
      query: (params) => ({
        url: "/reports/summary/export",
        method: "GET",
        params,
        responseType: "blob",
      }),
    }),
  }),
});

export const { 
  useGetReportSummaryQuery, 
  useGetRevenueTrendQuery, 
  useGetTopSkusQuery,
  useLazyExportInventoryReportQuery,
  useLazyExportReportSummaryQuery
} = reportApi;
