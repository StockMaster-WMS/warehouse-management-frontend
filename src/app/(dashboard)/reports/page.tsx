"use client";

import { Download, AlertCircle, TrendingUp, ShoppingBag, CheckCircle, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/ui/page-section";
import { StatCard } from "@/components/ui/stat-card";
import { useGetReportSummaryQuery, useLazyExportInventoryReportQuery } from "@/store/services/report.service";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueTrendChart } from "@/components/reports/revenue-trend-chart";
import { TopSkusTable } from "@/components/reports/top-skus-table";
import { apiErrMessage } from "@/types/api";

export default function ReportsPage() {
  const { data: summary, isLoading, isError, refetch } = useGetReportSummaryQuery();
  const [exportInventory, { isFetching: isExporting }] = useLazyExportInventoryReportQuery();

  const handleExportInventory = async () => {
    try {
      const blob = await exportInventory().unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải xuống báo cáo kho hàng");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tải báo cáo"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Báo cáo" description="Đang tải dữ liệu phân tích..." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {["inventory", "orders", "revenue"].map((key) => (
            <Skeleton key={key} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold">Không thể tải dữ liệu báo cáo</h3>
        <p className="text-muted-foreground mb-6">Lỗi khi kết nối với dịch vụ báo cáo.</p>
        <Button onClick={() => refetch()} variant="outline">Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Báo cáo & Phân tích"
        description="Theo dõi hiệu suất kinh doanh và luân chuyển kho hàng theo thời gian thực."
        actions={
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleExportInventory} 
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-95"
            >
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Tải báo cáo kho
            </Button>
            <Button size="sm" variant="outline" className="shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Tải báo cáo PDF
            </Button>
          </div>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 md:gap-6">
        <StatCard
          label="Tổng doanh thu"
          value={`${(summary?.totalRevenue ?? 0).toLocaleString('vi-VN')} ₫`}
          icon={TrendingUp}
          accentClassName="bg-indigo-600"
          description="Trong 30 ngày qua"
        />
        <StatCard
          label="Tổng đơn hàng"
          value={summary?.totalOrders?.toLocaleString() ?? "0"}
          icon={ShoppingBag}
          accentClassName="bg-amber-500"
          description="Đã hoàn thành & đang xử lý"
        />
        <StatCard
          label="Tỷ lệ hoàn thành"
          value={`${summary?.completionRate ?? 0}%`}
          icon={CheckCircle}
          accentClassName="bg-emerald-600"
          description="Tỷ lệ giao hàng đúng hạn"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <PageSection
          title="Biểu đồ doanh thu"
          description="Xu hướng doanh thu 7 ngày gần nhất."
          action={
            <Button variant="ghost" size="sm" className="h-8 text-indigo-600 text-xs font-bold hover:bg-indigo-50">
              Chi tiết <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          }
        >
          <div className="pt-2">
            <RevenueTrendChart data={summary?.revenueTrend} />
          </div>
        </PageSection>

        {/* Top Products */}
        <PageSection
          title="Top sản phẩm bán chạy"
          description="Dựa trên doanh thu và số lượng bán ra."
        >
          <TopSkusTable data={summary?.topSkus} />
        </PageSection>
      </div>
    </div>
  );
}
