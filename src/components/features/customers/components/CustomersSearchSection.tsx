import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { FilterGroup } from "@/components/features/FilterGroup";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
import {
  ALL_CUSTOMER_STATUS,
  CUSTOMER_STATUS_OPTIONS,
} from "@/components/features/customers/constants";

type CustomersSearchSectionProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  advancedCount: number;
  hasAnyFilter: boolean;
  onClearFilters: () => void;
  isFetching?: boolean;
  onRefresh: () => void;
  noContainer?: boolean;
};

export function CustomersSearchSection({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  advancedOpen,
  onToggleAdvanced,
  advancedCount,
  hasAnyFilter,
  onClearFilters,
  isFetching = false,
  onRefresh,
  noContainer = false,
}: CustomersSearchSectionProps) {
  const showFilters = advancedOpen || advancedCount > 0;

  return (
    <SearchToolbar
      noContainer={noContainer}
      placeholder="Tìm theo tên, email, số điện thoại..."
      value={searchInput}
      onValueChange={onSearchChange}
      right={
        <>
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
          <AdvancedFilterPanel
            open={advancedOpen}
            summary={
              advancedCount > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {statusFilter !== ALL_CUSTOMER_STATUS ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Trạng thái:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{statusFilter}</span>
                    </span>
                  ) : null}
                </div>
              ) : null
            }
          >
            <FilterGroup
              hasAnyFilter={hasAnyFilter}
              onClear={onClearFilters}
              showTitle={false}
              showClear={false}
              filters={[
                {
                  label: "trạng thái",
                  placeholder: "Trạng thái",
                  value: statusFilter,
                  onChange: onStatusChange,
                  options: CUSTOMER_STATUS_OPTIONS,
                  width: "sm:w-[180px]",
                },
              ]}
            />
          </AdvancedFilterPanel>
        ) : null
      }
    />
  );
}
