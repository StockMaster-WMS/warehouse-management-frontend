"use client";

import { useState } from "react";
import { Download, AlertCircle, TrendingUp, ShoppingBag, CheckCircle, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/ui/page-section";
import { StatCard } from "@/components/ui/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetReportSummaryQuery, useLazyExportReportSummaryQuery } from "@/store/services/report.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueTrendChart } from "@/components/reports/revenue-trend-chart";
import { TopSkusTable } from "@/components/reports/top-skus-table";
import { apiErrMessage } from "@/types/api";
import type { DashboardPeriod } from "@/types/dashboard";

const REPORT_PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string; description: string }> = [
  { value: "today", label: "Hôm nay", description: "Dữ liệu phát sinh trong ngày" },
  { value: "7d", label: "7 ngày", description: "7 ngày gần nhất" },
  { value: "30d", label: "1 tháng", description: "30 ngày gần nhất" },
  { value: "year", label: "Năm", description: "Tổng hợp theo tháng trong năm" },
];

const currentYear = new Date().getFullYear();
const REPORT_YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => currentYear - index);
const ALL_WAREHOUSES = "__all__";

export default function ReportsPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [warehouseId, setWarehouseId] = useState(ALL_WAREHOUSES);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const activePeriod = REPORT_PERIOD_OPTIONS.find((item) => item.value === period) ?? REPORT_PERIOD_OPTIONS[2];
  const reportParams = {
    period,
    year: period === "year" ? selectedYear : undefined,
    warehouseId: warehouseId === ALL_WAREHOUSES ? undefined : warehouseId,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };
  const { data: summary, isLoading, isFetching, isError, refetch } = useGetReportSummaryQuery(reportParams);
  const { data: warehousesData, isFetching: isWarehousesFetching } = useGetWarehousesQuery({ page: 0, size: 200, isActive: true });
  const [exportReportSummary, { isFetching: isExporting }] = useLazyExportReportSummaryQuery();
  const warehouses = warehousesData?.data?.content ?? [];
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId);
  const selectedWarehouseLabel = selectedWarehouse
    ? `${selectedWarehouse.name}${selectedWarehouse.code ? ` (${selectedWarehouse.code})` : ""}`
    : "Tất cả kho được phép";
  const rangeLabel = fromDate || toDate
    ? `${fromDate || "tự động"} đến ${toDate || "hôm nay"}`
    : period === "year"
      ? `năm ${selectedYear}`
      : activePeriod.description.toLowerCase();

  const handleExportReport = async () => {
    try {
      const blob = await exportReportSummary(reportParams).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const suffix = fromDate || toDate ? `${fromDate || "auto"}-${toDate || "today"}` : period === "year" ? selectedYear : period;
      const warehouseSuffix = selectedWarehouse?.code ? `-${selectedWarehouse.code}` : "";
      link.setAttribute('download', `summary-report-${suffix}${warehouseSuffix}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải xuống báo cáo theo thời gian đã chọn");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tải báo cáo"));
    }
  };

  const handleExportPdf = () => {
    toast.info("Đang mở hộp thoại in. Chọn 'Lưu thành PDF' để tải báo cáo.");
    window.print();
  };

  const scrollToRevenueDetail = () => {
    document.getElementById("revenue-detail")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
        <AlertCircle className="size-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-semibold">Không thể tải dữ liệu báo cáo</h3>
        <p className="text-muted-foreground mb-6">Lỗi khi kết nối với dịch vụ báo cáo.</p>
        <Button onClick={() => refetch()} variant="outline">Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Báo cáo & Phân tích"
        description={`Đang xem ${rangeLabel}${selectedWarehouse ? ` tại ${selectedWarehouse.name}` : ""}.`}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {period === "year" ? (
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setSelectedYear(Number(value))}
                disabled={isFetching}
              >
                <SelectTrigger className="h-9 w-full rounded-lg sm:w-32">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent align="end" className="rounded-lg">
                  {REPORT_YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button 
              size="sm" 
              onClick={handleExportReport} 
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-95"
            >
              {isExporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
              Tải báo cáo Excel
            </Button>
            <Button size="sm" variant="outline" className="shadow-sm" onClick={handleExportPdf}>
              <Download className="mr-2 size-4" />
              Tải báo cáo PDF
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Khoảng thời gian báo cáo
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dữ liệu biểu đồ, top SKU và file Excel đều dùng cùng bộ lọc này.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {REPORT_PERIOD_OPTIONS.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={period === item.value ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => setPeriod(item.value)}
              disabled={isFetching && period === item.value}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-3 shadow-sm md:grid-cols-[minmax(220px,1fr)_repeat(2,180px)_auto] md:items-end">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Kho xuất báo cáo</p>
          <Select
            name="reportWarehouseId"
            value={warehouseId}
            onValueChange={(value) => setWarehouseId(value ?? ALL_WAREHOUSES)}
            disabled={isWarehousesFetching || isFetching}
          >
            <SelectTrigger
              id="report-warehouse"
              aria-label="Kho xuất báo cáo"
              className="h-10 rounded-lg"
            >
              <span className="truncate text-left">{selectedWarehouseLabel}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value={ALL_WAREHOUSES}>Tất cả kho được phép</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}{warehouse.code ? ` (${warehouse.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Từ ngày</p>
          <Input
            id="report-from-date"
            name="fromDate"
            type="date"
            aria-label="Từ ngày"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-10 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Đến ngày</p>
          <Input
            id="report-to-date"
            name="toDate"
            type="date"
            aria-label="Đến ngày"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-10 rounded-lg"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg"
          onClick={() => {
            setWarehouseId(ALL_WAREHOUSES);
            setFromDate("");
            setToDate("");
          }}
          disabled={isFetching && !fromDate && !toDate && warehouseId === ALL_WAREHOUSES}
        >
          Xóa lọc
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 md:gap-6">
        <StatCard
          label="Tổng doanh thu"
          value={`${(summary?.totalRevenue ?? 0).toLocaleString('vi-VN')} ₫`}
          icon={TrendingUp}
          accentClassName="bg-indigo-600"
          description={period === "year" ? `Năm ${selectedYear}` : activePeriod.description}
        />
        <StatCard
          label="Tổng đơn hàng"
          value={summary?.totalOrders?.toLocaleString() ?? "0"}
          icon={ShoppingBag}
          accentClassName="bg-amber-500"
          description="Trong khoảng thời gian đã chọn"
        />
        <StatCard
          label="Tỷ lệ hoàn thành"
          value={`${summary?.completionRate ?? 0}%`}
          icon={CheckCircle}
          accentClassName="bg-emerald-600"
          description={`${summary?.shippedOrders ?? 0}/${summary?.activeOrders ?? 0} đơn hoạt động`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <PageSection
          title="Biểu đồ doanh thu"
          description={period === "year" ? "Doanh thu theo từng tháng trong năm." : `Xu hướng doanh thu trong ${activePeriod.label.toLowerCase()}.`}
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-indigo-600 text-xs font-bold hover:bg-indigo-50"
              onClick={scrollToRevenueDetail}
            >
              Chi tiết <ArrowUpRight className="ml-1 size-3" />
            </Button>
          }
        >
          <div id="revenue-detail" className="scroll-mt-24 pt-2">
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
