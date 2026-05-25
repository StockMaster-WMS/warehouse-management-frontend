"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  PackageCheck,
  RefreshCw,
  Route,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";

import { InboundOutboundChartLazy } from "@/components/dashboard/inbound-outbound-chart-lazy";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsGrid, type StatItem } from "@/components/ui/stats-grid";
import { useGetDashboardSummaryQuery } from "@/store/services/dashboard.service";
import { apiErrMessage } from "@/types/api";
import type { DashboardNoticeType, DashboardPeriod } from "@/types/dashboard";

const DASHBOARD_PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string; description: string }> = [
  { value: "today", label: "Hôm nay", description: "Biến động trong ngày" },
  { value: "7d", label: "7 ngày", description: "Tuần gần nhất" },
  { value: "30d", label: "1 tháng", description: "30 ngày gần nhất" },
  { value: "year", label: "Năm", description: "365 ngày gần nhất" },
];

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  year: 365,
};

const currentYear = new Date().getFullYear();
const DASHBOARD_YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => currentYear - index);

const METRIC_META: Record<string, Pick<StatItem, "icon" | "color">> = {
  revenue: { icon: TrendingUp, color: "text-indigo-500" },
  customers: { icon: Users, color: "text-emerald-500" },
  "available-stock": { icon: PackageCheck, color: "text-emerald-500" },
  "open-sales-orders": { icon: ShoppingCart, color: "text-blue-500" },
  "open-purchase-orders": { icon: ClipboardList, color: "text-amber-500" },
  "low-stock": { icon: AlertTriangle, color: "text-rose-500" },
};

const viNumberFormatter = new Intl.NumberFormat("vi-VN");
const viDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatNumber(value: number) {
  return viNumberFormatter.format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa rõ thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ thời gian";
  return viDateTimeFormatter.format(date);
}

function calcDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const percent = ((current - previous) / previous) * 100;
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

function NoticeIcon({ type }: { type: DashboardNoticeType }) {
  const cls = "mt-0.5 size-4 shrink-0";
  if (type === "error") return <AlertCircle className={cls} aria-hidden />;
  if (type === "warning") return <TriangleAlert className={cls} aria-hidden />;
  return <CheckCircle2 className={cls} aria-hidden />;
}

function noticeClassName(type: DashboardNoticeType) {
  if (type === "error") {
    return "border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
  }
  if (type === "warning") {
    return "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100";
  }
  return "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100";
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("7d");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const activePeriod = DASHBOARD_PERIOD_OPTIONS.find((item) => item.value === period) ?? DASHBOARD_PERIOD_OPTIONS[1];
  const { data: summary, error, isLoading, isFetching, refetch } =
    useGetDashboardSummaryQuery({
      period,
      year: period === "year" ? selectedYear : undefined,
    });
  const errorMessage = error
    ? apiErrMessage(error, "Không thể tải dữ liệu trang tổng quan")
    : null;
  const dashboardStats: StatItem[] =
    summary?.metrics?.map((stat) => ({
      label: stat.label,
      value: formatNumber(stat.value),
      icon: METRIC_META[stat.key]?.icon,
      color: METRIC_META[stat.key]?.color,
    })) ?? [];
  const operations = summary?.operations;
  const operationStats: StatItem[] = [
    {
      label: "Đơn chờ lấy hàng",
      value: formatNumber(operations?.pendingPickingOrders ?? 0),
      icon: ShoppingCart,
      color: "text-blue-500",
    },
    {
      label: "Picking quá hạn",
      value: formatNumber(operations?.overduePickingTasks ?? 0),
      icon: Clock,
      color: (operations?.overduePickingTasks ?? 0) > 0 ? "text-rose-500" : "text-emerald-500",
    },
    {
      label: "Tồn thấp",
      value: formatNumber(operations?.lowStockItems ?? 0),
      icon: AlertTriangle,
      color: (operations?.lowStockItems ?? 0) > 0 ? "text-rose-500" : "text-emerald-500",
    },
    {
      label: "Sắp hết hạn",
      value: formatNumber(operations?.nearExpiryLots ?? 0),
      icon: TriangleAlert,
      color: (operations?.nearExpiryLots ?? 0) > 0 ? "text-amber-500" : "text-emerald-500",
    },
    {
      label: "Độ chính xác kiểm kê",
      value: `${(operations?.cycleCountAccuracy ?? 100).toLocaleString("vi-VN")}%`,
      icon: BadgeCheck,
      color: (operations?.cycleCountAccuracy ?? 100) >= 95 ? "text-emerald-500" : "text-amber-500",
    },
    {
      label: "Hoàn thành hôm nay",
      value: formatNumber(operations?.completedOrdersToday ?? 0),
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
  ];
  const flow = summary?.flow ?? [];
  const todayFlow = flow[flow.length - 1];
  const yesterdayFlow = flow[flow.length - 2];
  const selectedDays = PERIOD_DAYS[period];
  const periodSummaryText = period === "year"
    ? `Dữ liệu năm ${selectedYear}, biểu đồ gom theo từng tháng.`
    : `${activePeriod.description}. Biểu đồ đang lấy ${selectedDays} ngày gần nhất.`;
  const totalInbound = flow.reduce((total, item) => total + item.inbound, 0);
  const totalOutbound = flow.reduce((total, item) => total + item.outbound, 0);
  const todayTotal = (todayFlow?.inbound ?? 0) + (todayFlow?.outbound ?? 0);
  const yesterdayTotal = (yesterdayFlow?.inbound ?? 0) + (yesterdayFlow?.outbound ?? 0);
  const timeStats = [
    {
      label: `Nhập ${activePeriod.label}`,
      value: formatNumber(totalInbound),
      description: todayFlow ? `Hôm nay: ${formatNumber(todayFlow.inbound)}` : "Chưa có dữ liệu hôm nay",
      icon: TrendingUp,
      tone: "text-emerald-600",
    },
    {
      label: `Xuất ${activePeriod.label}`,
      value: formatNumber(totalOutbound),
      description: todayFlow ? `Hôm nay: ${formatNumber(todayFlow.outbound)}` : "Chưa có dữ liệu hôm nay",
      icon: TrendingDown,
      tone: "text-sky-600",
    },
    {
      label: "Biến động hôm nay",
      value: formatNumber(todayTotal),
      description: `So với hôm qua: ${calcDelta(todayTotal, yesterdayTotal)}`,
      icon: History,
      tone: todayTotal >= yesterdayTotal ? "text-indigo-600" : "text-amber-600",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Khoảng thời gian dashboard
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Tổng quan {activePeriod.label.toLowerCase()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodSummaryText}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:shrink-0 sm:items-end">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {DASHBOARD_PERIOD_OPTIONS.map((item) => (
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

          {period === "year" ? (
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
              disabled={isFetching}
            >
              <SelectTrigger className="h-9 w-full rounded-lg sm:w-36">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-lg">
                {DASHBOARD_YEAR_OPTIONS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    Năm {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-lg sm:w-auto"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-1.5 size-4" />
            Thử lại
          </Button>
        </div>
      ) : null}

      <StatsGrid stats={dashboardStats} cols={4} isLoading={isLoading && !summary} />

      <PageSection
        title="Dashboard vận hành"
        description="Các chỉ số cần theo dõi trong ca vận hành kho."
      >
        <StatsGrid stats={operationStats} cols={6} isLoading={isLoading && !summary} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Đơn xuất chưa picking
              </span>
              <Route className="size-4 text-amber-500" aria-hidden />
            </div>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {formatNumber(operations?.outboundOrdersWithoutPicking ?? 0)}
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Đơn xuất đã chờ xử lý nhưng chưa có nhiệm vụ lấy hàng.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Kiểm kê lệch lớn
              </span>
              <AlertCircle className="size-4 text-rose-500" aria-hidden />
            </div>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {formatNumber(operations?.largeVarianceCycleCountItems ?? 0)}
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Dòng kiểm kê cần quản lý xem lại trước khi điều chỉnh tồn.
            </p>
          </div>
        </div>
      </PageSection>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6">
        <PageSection
          title="Thống kê theo thời gian"
          description={`Tổng hợp nhanh biến động nhập xuất trong ${activePeriod.label.toLowerCase()}.`}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {timeStats.map((item) => (
              <div key={item.label} className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {item.label}
                  </span>
                  <item.icon className={`size-4 ${item.tone}`} aria-hidden />
                </div>
                <div className="text-2xl font-bold tabular-nums text-foreground">
                  {item.value}
                </div>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2">
        <PageSection
          title="Lưu lượng xuất/nhập"
          description={
            isFetching
              ? `Đang cập nhật dữ liệu ${activePeriod.label.toLowerCase()}.`
              : `Theo biến động tồn kho trong ${activePeriod.label.toLowerCase()}.`
          }
        >
          <InboundOutboundChartLazy data={summary?.flow} />
        </PageSection>

        <PageSection
          title="Thông báo quan trọng"
          action={
            <Button
              render={<Link href="/history" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="rounded-lg"
            >
              Xem tất cả
            </Button>
          }
        >
          <div className="space-y-3">
            {(summary?.notices ?? []).map((msg) => (
              <div
                key={`${msg.type}-${msg.title}`}
                className={`flex items-start gap-3 rounded-xl border p-3 ${noticeClassName(msg.type)}`}
              >
                <NoticeIcon type={msg.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[13px] font-semibold">{msg.title}</span>
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                      {msg.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium opacity-90">
                    {msg.description}
                  </p>
                </div>
              </div>
            ))}

            {!summary?.notices?.length ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                {isLoading ? "Đang tải thông báo..." : "Chưa có thông báo."}
              </div>
            ) : null}
          </div>
        </PageSection>
      </div>

      <PageSection
        title="Nhật ký kiểm soát"
        description="Theo dõi ai tạo, duyệt, lấy hàng, xuất kho hoặc điều chỉnh tồn."
        action={
          <Button
            render={<Link href="/history" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            Xem lịch sử
          </Button>
        }
      >
        <div className="divide-y divide-border rounded-xl border bg-card">
          {(summary?.recentActivities ?? []).map((activity) => (
            <div key={activity.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {activity.action || activity.actionType || "Cập nhật dữ liệu"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[activity.module, activity.entityName, activity.actorName].filter(Boolean).join(" • ")}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {formatDateTime(activity.createdAt)}
              </span>
            </div>
          ))}

          {!summary?.recentActivities?.length ? (
            <div className="p-4 text-sm text-muted-foreground">
              {isLoading ? "Đang tải hoạt động..." : "Chưa có hoạt động gần đây."}
            </div>
          ) : null}
        </div>
      </PageSection>
    </div>
  );
}
