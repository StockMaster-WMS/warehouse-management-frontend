import {
  Building2,
  CalendarClock,
  List,
  PackageCheck,
} from "lucide-react";

type SuppliersStatsGridProps = {
  totalPartners: number;
  activeCount: number;
  inactiveCount: number;
  multiPage: boolean;
  pageDisplay: string;
};

export function SuppliersStatsGrid({
  totalPartners,
  activeCount,
  inactiveCount,
  multiPage,
  pageDisplay,
}: SuppliersStatsGridProps) {
  const stats = [
    { label: "Tổng đối tác", value: String(totalPartners), icon: Building2, color: "text-indigo-500" },
    {
      label: multiPage ? "Hoạt động (trang này)" : "Đang hoạt động",
      value: String(activeCount),
      icon: PackageCheck,
      color: "text-emerald-500",
    },
    {
      label: multiPage ? "Ngưng (trang này)" : "Ngưng hoạt động",
      value: String(inactiveCount),
      icon: CalendarClock,
      color: "text-amber-500",
    },
    {
      label: "Trang / kích thước",
      value: pageDisplay,
      icon: List,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
            <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
