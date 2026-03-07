import type { StockSummary } from "@/types/inventory";

interface StockSummaryCardProps {
  summary: StockSummary;
}

export function StockSummaryCard({ summary }: StockSummaryCardProps) {
  return (
    <section className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-3">
      <div>
        <p className="text-sm text-zinc-500">Tong san pham</p>
        <p className="text-2xl font-semibold">{summary.totalProducts}</p>
      </div>
      <div>
        <p className="text-sm text-amber-600">Sap het hang</p>
        <p className="text-2xl font-semibold">{summary.lowStockProducts}</p>
      </div>
      <div>
        <p className="text-sm text-red-600">Da het hang</p>
        <p className="text-2xl font-semibold">{summary.outOfStockProducts}</p>
      </div>
    </section>
  );
}
