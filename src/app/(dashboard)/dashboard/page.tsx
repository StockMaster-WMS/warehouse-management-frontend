"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";

import { InboundOutboundChartLazy } from "@/components/dashboard/inbound-outbound-chart-lazy";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import { StatsGrid, type StatItem } from "@/components/ui/stats-grid";
import { useGetDashboardSummaryQuery } from "@/store/services/dashboard.service";
import { apiErrMessage } from "@/types/api";
import type { DashboardNoticeType } from "@/types/dashboard";

const METRIC_META: Record<string, Pick<StatItem, "icon" | "color">> = {
  "available-stock": { icon: PackageCheck, color: "text-emerald-500" },
  "open-sales-orders": { icon: ShoppingCart, color: "text-blue-500" },
  "open-purchase-orders": { icon: ClipboardList, color: "text-amber-500" },
  "low-stock": { icon: AlertTriangle, color: "text-rose-500" },
};

const viNumberFormatter = new Intl.NumberFormat("vi-VN");

function formatNumber(value: number) {
  return viNumberFormatter.format(value);
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
  const errorMessage = error
    ? apiErrMessage(error, "Không thể tải dữ liệu dashboard")
    : null;
  const dashboardStats: StatItem[] =
    summary?.metrics?.map((stat) => ({
      label: stat.label,
      value: formatNumber(stat.value),
      icon: METRIC_META[stat.key]?.icon,
      color: METRIC_META[stat.key]?.color,
    })) ?? [];

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
    </div>
  );
}
