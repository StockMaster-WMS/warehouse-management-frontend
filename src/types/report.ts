export interface RevenueTrend {
  date: string;
  revenue: number;
}

export interface TopSku {
  productSku: string;
  totalQty: number;
  totalRevenue: number;
}

export interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  completionRate: number;
  revenueTrend: RevenueTrend[];
  topSkus: TopSku[];
}
