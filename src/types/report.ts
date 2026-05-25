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
  activeOrders?: number;
  shippedOrders?: number;
  completionRate: number;
  fromDate?: string;
  toDate?: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
  revenueTrend: RevenueTrend[];
  topSkus: TopSku[];
}
