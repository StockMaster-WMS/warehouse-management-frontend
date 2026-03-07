import { StockSummaryCard } from "@/components/features/inventory/stock-summary-card";

const mockSummary = {
  totalProducts: 1280,
  lowStockProducts: 36,
  outOfStockProducts: 5,
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Warehouse Dashboard</h1>
      <StockSummaryCard summary={mockSummary} />
    </div>
  );
}
