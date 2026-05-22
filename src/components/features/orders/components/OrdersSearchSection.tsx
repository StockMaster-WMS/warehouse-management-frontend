import { SearchToolbar } from "@/components/ui/search-toolbar";
import { AdvancedFilterActions } from "@/components/features/AdvancedFilters";
import { OrdersFiltersPanel } from "@/components/features/orders/components/OrdersFiltersPanel";
import { OperationDatePresetSelect } from "@/components/ui/operation-date-preset-select";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
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
  isFetching?: boolean;
  onRefresh: () => void;
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
  isFetching = false,
  onRefresh,
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
        <>
          <OperationDatePresetSelect
            value={datePreset}
            onValueChange={onDatePresetChange}
          />
          <TableRefreshButton isFetching={isFetching} onRefresh={onRefresh} />
          <AdvancedFilterActions
            open={advancedOpen}
            onToggle={onToggleAdvanced}
            activeCount={advancedCount}
            hasAnyFilter={hasAnyFilter}
            onClear={onClearFilters}
          />
        </>
      }
      filters={
        showFilters ? (
          <OrdersFiltersPanel
            open={advancedOpen}
            advancedCount={advancedCount}
            hasAnyFilter={hasAnyFilter}
            statusFilter={statusFilter}
            onStatusChange={onStatusChange}
            onClear={onClearFilters}
          />
        ) : null
      }
    />
  );
}
