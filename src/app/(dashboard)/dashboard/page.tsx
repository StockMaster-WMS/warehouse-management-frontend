import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";

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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Lưu lượng xuất/nhập
            </h3>
          </div>
          <div className="flex h-60 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
            <span className="text-sm font-medium text-slate-400">
              Biểu đồ đang được tải...
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Thông báo quan trọng
            </h3>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Cảnh báo tồn kho thấp",
                desc: "Sản phẩm iPhone 15 Pro Max chỉ còn 2 đơn vị.",
                type: "error",
              },
              {
                title: "Đã xác nhận đơn hàng",
                desc: "Đơn hàng #3390 đã được đóng gói và sẵn sàng giao.",
                type: "success",
              },
              {
                title: "Hệ thống bảo trì",
                desc: "Hệ thống sẽ bảo trì vào lúc 02:00 sáng mai.",
                type: "warning",
              },
            ].map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 p-3 rounded-xl border ${msg.type === "error" ? "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400" : msg.type === "warning" ? "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30" : "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30"}`}
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold">{msg.title}</span>
                  <p className="text-[12px] font-medium opacity-80">
                    {msg.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
