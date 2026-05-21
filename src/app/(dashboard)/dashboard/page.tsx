"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  History,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { InboundOutboundChartLazy } from "@/components/dashboard/inbound-outbound-chart-lazy";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import { StatsGrid, type StatItem } from "@/components/ui/stats-grid";
import { useGetDashboardSummaryQuery } from "@/store/services/dashboard.service";
import { useLazyExportInventoryReportQuery } from "@/store/services/report.service";
import { apiErrMessage } from "@/types/api";
import type { DashboardNoticeType } from "@/types/dashboard";

const METRIC_META: Record<string, Pick<StatItem, "icon" | "color">> = {
  revenue: { icon: TrendingUp, color: "text-indigo-500" },
  customers: { icon: Users, color: "text-emerald-500" },
  "available-stock": { icon: PackageCheck, color: "text-emerald-500" },
  "open-sales-orders": { icon: ShoppingCart, color: "text-blue-500" },
  "open-purchase-orders": { icon: ClipboardList, color: "text-amber-500" },
  "low-stock": { icon: AlertTriangle, color: "text-rose-500" },
};

const viNumberFormatter = new Intl.NumberFormat("vi-VN");

function formatNumber(value: number) {
  return viNumberFormatter.format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa rõ thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ thời gian";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function calcDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const percent = ((current - previous) / previous) * 100;
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

function NoticeIcon({ type }: { type: DashboardNoticeType }) {
  const cls = "mt-0.5 h-4 w-4 shrink-0";
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
  const { data: summary, error, isLoading, isFetching, refetch } =
    useGetDashboardSummaryQuery();
  const [exportInventoryReport, { isFetching: isExporting }] =
    useLazyExportInventoryReportQuery();
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
  const flow = summary?.flow ?? [];
  const todayFlow = flow[flow.length - 1];
  const yesterdayFlow = flow[flow.length - 2];
  const sevenDayInbound = flow.reduce((total, item) => total + item.inbound, 0);
  const sevenDayOutbound = flow.reduce((total, item) => total + item.outbound, 0);
  const todayTotal = (todayFlow?.inbound ?? 0) + (todayFlow?.outbound ?? 0);
  const yesterdayTotal = (yesterdayFlow?.inbound ?? 0) + (yesterdayFlow?.outbound ?? 0);
  const timeStats = [
    {
      label: "Nhập 7 ngày",
      value: formatNumber(sevenDayInbound),
      description: todayFlow ? `Hôm nay: ${formatNumber(todayFlow.inbound)}` : "Chưa có dữ liệu hôm nay",
      icon: TrendingUp,
      tone: "text-emerald-600",
    },
    {
      label: "Xuất 7 ngày",
      value: formatNumber(sevenDayOutbound),
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

  const handleExportInventory = async () => {
    try {
      const blob = await exportInventoryReport().unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `inventory-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải báo cáo tồn kho");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể xuất báo cáo tồn kho"));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Thử lại
          </Button>
        </div>
      ) : null}

      <StatsGrid stats={dashboardStats} cols={4} isLoading={isLoading && !summary} />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <PageSection
          title="Thống kê theo thời gian"
          description="Tổng hợp nhanh biến động nhập xuất trong 7 ngày gần nhất."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {timeStats.map((item) => (
              <div key={item.label} className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {item.label}
                  </span>
                  <item.icon className={`h-4 w-4 ${item.tone}`} aria-hidden />
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

        <PageSection title="Xuất báo cáo" description="Tải nhanh dữ liệu phục vụ chốt ca.">
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full justify-start rounded-lg"
              onClick={handleExportInventory}
              disabled={isExporting}
            >
              {isExporting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Báo cáo tồn kho Excel
            </Button>
            <Button
              render={<Link href="/reports" />}
              nativeButton={false}
              variant="outline"
              className="w-full justify-start rounded-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Trung tâm báo cáo
            </Button>
          </div>
        </PageSection>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2">
        <PageSection
          title="Lưu lượng xuất/nhập"
          description={
            isFetching
              ? "Đang cập nhật dữ liệu 7 ngày gần nhất."
              : "Theo biến động tồn kho 7 ngày gần nhất."
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
        title="Hoạt động gần đây"
        description="Các thay đổi mới nhất được ghi nhận từ nhật ký hệ thống."
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
