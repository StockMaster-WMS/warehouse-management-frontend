import Link from "next/link";
import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";

import { InboundOutboundChartLazy } from "@/components/dashboard/inbound-outbound-chart-lazy";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

const NOTICES: Array<{
  title: string;
  desc: string;
  type: "error" | "success" | "warning";
  time: string;
}> = [
  {
    title: "Cảnh báo tồn kho thấp",
    desc: "Sản phẩm iPhone 15 Pro Max chỉ còn 2 đơn vị.",
    type: "error",
    time: "10:42",
  },
  {
    title: "Đã xác nhận đơn hàng",
    desc: "Đơn hàng #3390 đã được đóng gói và sẵn sàng giao.",
    type: "success",
    time: "09:15",
  },
  {
    title: "Hệ thống bảo trì",
    desc: "Hệ thống sẽ bảo trì vào lúc 02:00 sáng mai.",
    type: "warning",
    time: "Hôm qua",
  },
];

function NoticeIcon({ type }: { type: (typeof NOTICES)[number]["type"] }) {
  const cls = "mt-0.5 h-4 w-4 shrink-0";
  if (type === "error") return <AlertCircle className={cls} aria-hidden />;
  if (type === "warning") return <TriangleAlert className={cls} aria-hidden />;
  return <CheckCircle2 className={cls} aria-hidden />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Xin chào, An Nguyen!"
        description="Hệ thống StockMaster đang hoạt động ổn định. Xem báo cáo hôm nay."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Doanh thu ngày",
            value: "45.8M ₫",
            color: "bg-indigo-600",
            trend: "+12%",
          },
          {
            label: "Đơn hàng mới",
            value: "128",
            color: "bg-emerald-600",
            trend: "+5%",
          },
          {
            label: "Kho hàng nhập",
            value: "12",
            color: "bg-amber-500",
            trend: "-2%",
          },
          {
            label: "Khách hàng mới",
            value: "24",
            color: "bg-rose-500",
            trend: "+18%",
          },
        ].map((stat, i) => (
          <StatCard
            key={i}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            accentClassName={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PageSection
          title="Lưu lượng xuất/nhập"
          description="Theo ngày trong tuần (dữ liệu mẫu — kết nối API sau)."
        >
          <InboundOutboundChartLazy />
        </PageSection>

        <PageSection
          title="Thông báo quan trọng"
          action={
            <Button render={<Link href="/history" />} nativeButton={false} variant="outline" size="sm" className="rounded-lg">
              Xem tất cả
            </Button>
          }
        >
          <div className="space-y-3">
            {NOTICES.map((msg, i) => (
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
            ))}
          </div>
        </PageSection>
      </div>
    </div>
  );
}
