import { AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { FilterGroup } from "@/components/features/FilterGroup";
import { ORDER_STATUS_FILTER_OPTIONS } from "@/components/features/orders/constants";

type OrdersFiltersPanelProps = {
  open: boolean;
  advancedCount: number;
  hasAnyFilter: boolean;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onClear: () => void;
};

export function OrdersFiltersPanel({
  open,
  advancedCount,
  hasAnyFilter,
  statusFilter,
  onStatusChange,
  onClear,
}: OrdersFiltersPanelProps) {
  return (
    <AdvancedFilterPanel
      open={open}
      summary={
        advancedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            {statusFilter !== "Tất cả trạng thái" ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                Trạng thái: <span className="font-semibold text-slate-800 dark:text-slate-100">{statusFilter}</span>
              </span>
            ) : null}
          </div>
        ) : null
      }
    >
      <FilterGroup
        hasAnyFilter={hasAnyFilter}
        onClear={onClear}
        showTitle={false}
        showClear={false}
        filters={[
          {
            label: "trạng thái",
            placeholder: "Trạng thái",
            value: statusFilter,
            onChange: onStatusChange,
            options: [...ORDER_STATUS_FILTER_OPTIONS],
            width: "sm:w-[200px]",
          },
        ]}
      />
    </AdvancedFilterPanel>
  );
}
