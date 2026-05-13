"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, TriangleAlert, Activity, Clock, User, Package, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { InboundOutboundChartLazy } from "@/components/dashboard/inbound-outbound-chart-lazy";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { useGetDashboardSummaryQuery } from "@/store/services/dashboard.service";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";
import { Skeleton } from "@/components/ui/skeleton";

function NoticeIcon({ type }: { type: "error" | "success" | "warning" }) {
  const cls = "mt-0.5 h-4 w-4 shrink-0";
  if (type === "error") return <AlertCircle className={cls} aria-hidden />;
  if (type === "warning") return <TriangleAlert className={cls} aria-hidden />;
  return <CheckCircle2 className={cls} aria-hidden />;
}

export default function DashboardPage() {
  const { data: user } = useGetCurrentUserQuery();
  const { data: summary, isLoading, isError, refetch } = useGetDashboardSummaryQuery();

  const userName = user?.name || user?.username || "Người dùng";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={`Xin chào...`} 
          description="Đang tải dữ liệu tổng quan hệ thống..." 
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold">Không thể tải dữ liệu Dashboard</h3>
        <p className="text-muted-foreground mb-6">Đã có lỗi xảy ra khi kết nối với máy chủ thống kê.</p>
        <Button onClick={() => refetch()} variant="outline">Thử lại</Button>
      </div>
    );
  }

  const metrics = summary?.metrics || [];
  const flowData = summary?.flow || [];
  const notices = summary?.notices || [];
  const recentActivities = summary?.recentActivities || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={`Xin chào, ${userName}!`}
        description="Hệ thống StockMaster đang hoạt động ổn định. Xem báo cáo hôm nay."
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 md:gap-6">
        {metrics.map((stat, i) => (
          <StatCard
            key={stat.id || i}
            label={stat.label}
            value={
              typeof stat.value === 'number' && stat.id?.includes('revenue') 
                ? `${stat.value.toLocaleString('vi-VN')} ₫` 
                : (stat.value?.toString() ?? "0")
            }
            trend={stat.trend}
            accentClassName={stat.color || (i === 0 ? "bg-indigo-600" : i === 1 ? "bg-emerald-600" : i === 2 ? "bg-amber-500" : "bg-rose-500")}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2">
        {/* Flow Chart */}
        <PageSection
          title="Lưu lượng xuất/nhập"
          description="Dữ liệu thực tế 7 ngày gần nhất."
        >
          <InboundOutboundChartLazy data={flowData} />
        </PageSection>

        {/* Notices Section */}
        <PageSection
          title="Thông báo quan trọng"
          action={
            <Button render={<Link href="/history" />} nativeButton={false} variant="outline" size="sm" className="rounded-lg">
              Xem tất cả
            </Button>
          }
        >
          <div className="space-y-3">
            {notices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Không có thông báo mới.</div>
            ) : (
              notices.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    msg.type === "error"
                      ? "border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                      : msg.type === "warning"
                        ? "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100"
                        : "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100"
                  }`}
                >
                  <NoticeIcon type={msg.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[13px] font-semibold">{msg.title}</span>
                      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                        {msg.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] font-medium opacity-90">{msg.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </PageSection>
      </div>

      {/* Recent Activities Section */}
      <PageSection
        title="Hoạt động gần đây"
        description="5 hoạt động hệ thống mới nhất."
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentActivities.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Chưa có hoạt động nào được ghi lại.</div>
          ) : (
            recentActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {act.action} {act.entityName && <span className="text-indigo-600 dark:text-indigo-400 font-bold">{act.entityName}</span>}
                    </p>
                    <span className="text-xs text-slate-400 font-medium">
                      {format(new Date(act.createdAt), "HH:mm, dd/MM", { locale: vi })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {act.actorName}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <Package className="h-3 w-3" /> {act.module.toLowerCase()}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase font-bold dark:bg-slate-800">
                      {act.actionType}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PageSection>
    </div>
  );
}
