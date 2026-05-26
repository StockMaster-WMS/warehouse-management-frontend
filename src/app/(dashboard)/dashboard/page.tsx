"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  PackageCheck,
  RefreshCw,
  Route,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { InboundOutboundChartLazy } from "@/components/dashboard/inbound-outbound-chart-lazy";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGetDashboardSummaryQuery } from "@/store/services/dashboard.service";
import { apiErrMessage } from "@/types/api";
import type {
  DashboardActivity,
  DashboardMetric,
  DashboardNoticeType,
  DashboardPeriod,
} from "@/types/dashboard";

const DASHBOARD_PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string; description: string }> = [
  { value: "today", label: "Hôm nay", description: "Biến động trong ngày" },
  { value: "7d", label: "7 ngày", description: "Tuần vận hành gần nhất" },
  { value: "30d", label: "1 tháng", description: "30 ngày gần nhất" },
  { value: "year", label: "Năm", description: "Theo dõi cả năm" },
];

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  year: 365,
};

const currentYear = new Date().getFullYear();
const DASHBOARD_YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => currentYear - index);

const METRIC_META: Record<string, { icon: LucideIcon; color: string; hint: string }> = {
  revenue: { icon: TrendingUp, color: "text-indigo-600", hint: "Doanh thu ghi nhận" },
  customers: { icon: Users, color: "text-cyan-600", hint: "Khách hàng đang hoạt động" },
  "available-stock": { icon: PackageCheck, color: "text-emerald-600", hint: "Tồn khả dụng toàn hệ thống" },
  "open-sales-orders": { icon: ShoppingCart, color: "text-blue-600", hint: "Đơn xuất cần xử lý" },
  "open-purchase-orders": { icon: ClipboardList, color: "text-amber-600", hint: "Đơn nhập đang mở" },
  "low-stock": { icon: AlertTriangle, color: "text-rose-600", hint: "Mã hàng cần bổ sung" },
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
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100";
  }
  if (type === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100";
}

function getMetric(metrics: DashboardMetric[] | undefined, key: string) {
  return metrics?.find((metric) => metric.key === key);
}

function KpiCard({ metric }: { metric: DashboardMetric }) {
  const meta = METRIC_META[metric.key] ?? { icon: BarChart3, color: "text-slate-600", hint: metric.label };
  const Icon = meta.icon;
  const trendTone = metric.trend?.startsWith("-") ? "text-rose-600" : "text-emerald-600";

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase text-muted-foreground">{metric.label}</p>
          <p className="mt-2 truncate text-xl font-semibold tabular-nums text-foreground 2xl:text-2xl">
            {formatNumber(metric.value)}
          </p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted 2xl:size-10">
          <Icon className={cn("size-4 2xl:size-5", meta.color)} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs font-medium">
        <span className="truncate text-muted-foreground">{meta.hint}</span>
        {metric.trend ? <span className={cn("shrink-0 tabular-nums", trendTone)}>{metric.trend}</span> : null}
      </div>
    </article>
  );
}

function ActionTile({
  href,
  icon: Icon,
  label,
  value,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:bg-muted/45"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className={cn("size-4", tone)} />
        </span>
        <span className="truncate text-sm font-semibold text-foreground">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
        <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </span>
    </Link>
  );
}

function ActivityRow({ activity }: { activity: DashboardActivity }) {
  return (
    <div className="grid gap-2 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {activity.action || activity.actionType || "Cập nhật dữ liệu"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[activity.module, activity.entityName, activity.actorName].filter(Boolean).join(" • ")}
        </p>
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">{formatDateTime(activity.createdAt)}</span>
    </div>
  );
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

  const operations = summary?.operations;
  const flow = summary?.flow ?? [];
  const todayFlow = flow[flow.length - 1];
  const yesterdayFlow = flow[flow.length - 2];
  const totalInbound = flow.reduce((total, item) => total + item.inbound, 0);
  const totalOutbound = flow.reduce((total, item) => total + item.outbound, 0);
  const todayTotal = (todayFlow?.inbound ?? 0) + (todayFlow?.outbound ?? 0);
  const yesterdayTotal = (yesterdayFlow?.inbound ?? 0) + (yesterdayFlow?.outbound ?? 0);
  const flowBalance = totalInbound - totalOutbound;
  const selectedDays = PERIOD_DAYS[period];
  const periodSummaryText = period === "year"
    ? `Dữ liệu năm ${selectedYear}, biểu đồ gom theo từng tháng.`
    : `${activePeriod.description}. Biểu đồ đang lấy ${selectedDays} ngày gần nhất.`;
  const errorMessage = error
    ? apiErrMessage(error, "Không thể tải dữ liệu trang tổng quan")
    : null;

  const metrics = summary?.metrics ?? [];
  const orderedMetrics = [
    getMetric(metrics, "available-stock"),
    getMetric(metrics, "low-stock"),
    getMetric(metrics, "revenue"),
    getMetric(metrics, "customers"),
    getMetric(metrics, "open-sales-orders"),
    getMetric(metrics, "open-purchase-orders"),
  ].filter(Boolean) as DashboardMetric[];
  const dashboardMetrics = [
    ...orderedMetrics,
    ...metrics.filter((metric) => !orderedMetrics.some((item) => item.key === metric.key)),
  ];
  const metricsToRender: Array<DashboardMetric | null> =
    isLoading && !summary ? Array.from({ length: 4 }, () => null) : dashboardMetrics;

  const riskItems = useMemo(() => [
    {
      label: "Picking quá hạn",
      value: operations?.overduePickingTasks ?? 0,
      href: "/picking",
      icon: Clock,
      tone: (operations?.overduePickingTasks ?? 0) > 0 ? "text-rose-600" : "text-emerald-600",
    },
    {
      label: "Đơn xuất chưa picking",
      value: operations?.outboundOrdersWithoutPicking ?? 0,
      href: "/orders",
      icon: Route,
      tone: (operations?.outboundOrdersWithoutPicking ?? 0) > 0 ? "text-amber-600" : "text-emerald-600",
    },
    {
      label: "Tồn thấp",
      value: operations?.lowStockItems ?? 0,
      href: "/inventory",
      icon: AlertTriangle,
      tone: (operations?.lowStockItems ?? 0) > 0 ? "text-rose-600" : "text-emerald-600",
    },
    {
      label: "Lô sắp hết hạn",
      value: operations?.nearExpiryLots ?? 0,
      href: "/inventory",
      icon: TriangleAlert,
      tone: (operations?.nearExpiryLots ?? 0) > 0 ? "text-amber-600" : "text-emerald-600",
    },
  ], [operations]);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <Warehouse className="size-3.5" />
                  Dashboard vận hành
                </span>
                {isFetching ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    <RefreshCw className="size-3.5 animate-spin" />
                    Đang cập nhật
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Tổng quan {activePeriod.label.toLowerCase()}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {periodSummaryText}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {DASHBOARD_PERIOD_OPTIONS.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant={period === item.value ? "default" : "outline"}
                    size="sm"
                    className="rounded-md"
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
                  <SelectTrigger className="h-9 w-full rounded-md sm:w-36">
                    <SelectValue placeholder="Chọn năm" />
                  </SelectTrigger>
                  <SelectContent align="end" className="rounded-md">
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
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
              <span>{errorMessage}</span>
              <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 size-4" />
                Thử lại
              </Button>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {metricsToRender.map((metric, index) => (
              metric ? <KpiCard key={metric.key} metric={metric} /> : (
                <div key={`metric-skeleton-${index}`} className="h-32 animate-pulse rounded-lg border border-border bg-muted/50" />
              )
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {riskItems.map((item) => (
              <ActionTile
                key={item.label}
                href={item.href}
                icon={item.icon}
                label={item.label}
                value={formatNumber(item.value)}
                tone={item.tone}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Lưu lượng kho</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Nhập, xuất và chênh lệch tồn</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {isFetching ? "Đang cập nhật dữ liệu biểu đồ." : `Theo ${activePeriod.label.toLowerCase()} đang chọn.`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-right text-xs">
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                <p className="font-bold">Nhập</p>
                <p className="tabular-nums">{formatNumber(totalInbound)}</p>
              </div>
              <div className="rounded-md bg-blue-50 px-3 py-2 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200">
                <p className="font-bold">Xuất</p>
                <p className="tabular-nums">{formatNumber(totalOutbound)}</p>
              </div>
              <div className="rounded-md bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <p className="font-bold">Net</p>
                <p className="tabular-nums">{formatNumber(flowBalance)}</p>
              </div>
            </div>
          </div>
          <InboundOutboundChartLazy data={flow} />
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Nhịp hôm nay</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">So với hôm qua</h2>
              </div>
              <Activity className="size-5 text-primary" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Tổng lượt</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{formatNumber(todayTotal)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Hôm qua</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{formatNumber(yesterdayTotal)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Chênh lệch</p>
                <p className={cn("mt-1 text-xl font-semibold tabular-nums", todayTotal >= yesterdayTotal ? "text-emerald-600" : "text-amber-600")}>
                  {calcDelta(todayTotal, yesterdayTotal)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Cảnh báo</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">Cần chú ý</h2>
              </div>
              <Button render={<Link href="/history" />} nativeButton={false} variant="outline" size="sm" className="rounded-md">
                Nhật ký
              </Button>
            </div>
            <div className="space-y-2">
              {(summary?.notices ?? []).slice(0, 4).map((msg) => (
                <div key={`${msg.type}-${msg.title}`} className={cn("flex items-start gap-3 rounded-lg border p-3", noticeClassName(msg.type))}>
                  <NoticeIcon type={msg.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">{msg.title}</span>
                      <span className="text-[11px] font-medium tabular-nums opacity-75">{msg.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium opacity-90">{msg.description}</p>
                  </div>
                </div>
              ))}
              {!summary?.notices?.length ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/45 p-4 text-sm text-muted-foreground">
                  {isLoading ? "Đang tải cảnh báo..." : "Chưa có cảnh báo đáng chú ý."}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">Pipeline xử lý</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">Tình trạng nghiệp vụ</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Đơn chờ lấy", value: operations?.pendingPickingOrders ?? 0, icon: ShoppingCart, href: "/picking", color: "text-blue-600" },
              { label: "Hoàn thành hôm nay", value: operations?.completedOrdersToday ?? 0, icon: CheckCircle2, href: "/orders", color: "text-emerald-600" },
              { label: "Kiểm kê lệch lớn", value: operations?.largeVarianceCycleCountItems ?? 0, icon: BadgeCheck, href: "/cycle-counts", color: "text-rose-600" },
            ].map((item) => (
              <ActionTile
                key={item.label}
                href={item.href}
                icon={item.icon}
                label={item.label}
                value={formatNumber(item.value)}
                tone={item.color}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Nhật ký kiểm soát</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Hoạt động gần đây</h2>
            </div>
            <Button render={<Link href="/history" />} nativeButton={false} variant="outline" size="sm" className="rounded-md">
              <History className="mr-1.5 size-4" />
              Xem tất cả
            </Button>
          </div>
          <div>
            {(summary?.recentActivities ?? []).slice(0, 7).map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
            {!summary?.recentActivities?.length ? (
              <div className="p-4 text-sm text-muted-foreground">
                {isLoading ? "Đang tải hoạt động..." : "Chưa có hoạt động gần đây."}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
