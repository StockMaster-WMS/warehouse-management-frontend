import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { FilterGroup } from "@/components/features/FilterGroup";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import {
  ALL_CUSTOMER_CATEGORY,
  CUSTOMER_CATEGORY_OPTIONS,
} from "@/components/features/customers/constants";

type CustomersSearchSectionProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  advancedCount: number;
  hasAnyFilter: boolean;
  onClearFilters: () => void;
  noContainer?: boolean;
};

export function CustomersSearchSection({
  searchInput,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  advancedOpen,
  onToggleAdvanced,
  advancedCount,
  hasAnyFilter,
  onClearFilters,
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
          <AdvancedFilterPanel
            open={advancedOpen}
            summary={
              advancedCount > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {categoryFilter !== ALL_CUSTOMER_CATEGORY ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                      Phân loại:{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{categoryFilter}</span>
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
                  label: "phân loại",
                  placeholder: "Phân loại",
                  value: categoryFilter,
                  onChange: onCategoryChange,
                  options: CUSTOMER_CATEGORY_OPTIONS,
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
