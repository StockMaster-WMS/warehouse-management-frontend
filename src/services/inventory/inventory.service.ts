import { axiosInstance } from "@/lib/axios-instance";
import type { ApiResponse } from "@/types/api";
import type { StockSummary } from "@/types/inventory";

export async function getStockSummary(): Promise<StockSummary> {
  const response = await axiosInstance.get<ApiResponse<StockSummary>>("/inventory/summary");
  return response.data.data;
}
