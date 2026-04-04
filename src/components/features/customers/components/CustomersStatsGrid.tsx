import { buildCustomerStats } from "@/components/features/customers/utils";

export function CustomersStatsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {buildCustomerStats().map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
