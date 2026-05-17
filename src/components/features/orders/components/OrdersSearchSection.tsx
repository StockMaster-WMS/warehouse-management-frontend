import { SearchToolbar } from "@/components/ui/search-toolbar";
import { AdvancedFilterActions } from "@/components/features/AdvancedFilters";
import { OrdersFiltersPanel } from "@/components/features/orders/components/OrdersFiltersPanel";
import type { OperationDatePreset } from "@/lib/date-range";

type OrdersSearchSectionProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  advancedCount: number;
  hasAnyFilter: boolean;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  datePreset: OperationDatePreset;
  onDatePresetChange: (value: OperationDatePreset) => void;
  onClearFilters: () => void;
  noContainer?: boolean;
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
  datePreset,
  onDatePresetChange,
  onClearFilters,
  noContainer = false,
}: OrdersSearchSectionProps) {
  const showFilters = advancedOpen || advancedCount > 0;

  return (
    <SearchToolbar
      noContainer={noContainer}
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
        showFilters ? (
          <OrdersFiltersPanel
            open={advancedOpen}
            advancedCount={advancedCount}
            hasAnyFilter={hasAnyFilter}
            statusFilter={statusFilter}
            onStatusChange={onStatusChange}
            datePreset={datePreset}
            onDatePresetChange={onDatePresetChange}
            onClear={onClearFilters}
          />
        ) : null
      }
    />
  );
}
