import { SearchToolbar } from "@/components/ui/search-toolbar";
import { AdvancedFilterActions } from "@/components/features/AdvancedFilters";
import { OrdersFiltersPanel } from "@/components/features/orders/components/OrdersFiltersPanel";

type OrdersSearchSectionProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  advancedCount: number;
  hasAnyFilter: boolean;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
};

export function OrdersSearchSection({
  searchInput,
  onSearchChange,
  advancedOpen,
  onToggleAdvanced,
  advancedCount,
  hasAnyFilter,
  statusFilter,
  onStatusChange,
  onClearFilters,
}: OrdersSearchSectionProps) {
  return (
    <SearchToolbar
      placeholder="Tìm theo số đơn, khách hàng, địa chỉ..."
      value={searchInput}
      onValueChange={onSearchChange}
      right={
        <AdvancedFilterActions
          open={advancedOpen}
          onToggle={onToggleAdvanced}
          activeCount={advancedCount}
          hasAnyFilter={hasAnyFilter}
          onClear={onClearFilters}
        />
      }
      filters={
        <OrdersFiltersPanel
          open={advancedOpen}
          advancedCount={advancedCount}
          hasAnyFilter={hasAnyFilter}
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          onClear={onClearFilters}
        />
      }
    />
  );
}
