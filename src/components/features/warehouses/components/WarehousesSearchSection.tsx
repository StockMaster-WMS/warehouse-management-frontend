import { FilterGroup } from "@/components/features/FilterGroup";
import { AdvancedFilterActions, AdvancedFilterPanel } from "@/components/features/AdvancedFilters";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import {
    SORT_DIR_OPTIONS,
    SORT_FIELD_OPTIONS,
    STATUS_LABEL_ACTIVE,
    STATUS_LABEL_INACTIVE,
} from "@/components/features/warehouses/constants";

type WarehousesSearchSectionProps = {
    searchInput: string;
    onSearchChange: (value: string) => void;
    advancedOpen: boolean;
    onToggleAdvanced: () => void;
    advancedCount: number;
    hasAnyFilter: boolean;
    statusValue: string;
    sortValue: string;
    sortDirValue: string;
    onStatusChange: (value: string) => void;
    onSortChange: (value: string) => void;
    onSortDirChange: (value: string) => void;
    onClearFilters: () => void;
    noContainer?: boolean;
};

export function WarehousesSearchSection({
    searchInput,
    onSearchChange,
    advancedOpen,
    onToggleAdvanced,
    advancedCount,
    hasAnyFilter,
    statusValue,
    sortValue,
    sortDirValue,
    onStatusChange,
    onSortChange,
    onSortDirChange,
    onClearFilters,
    noContainer = false,
}: WarehousesSearchSectionProps) {
    const showFilters = advancedOpen || advancedCount > 0;

    return (
        <SearchToolbar
            noContainer={noContainer}
            placeholder="Tìm theo tên kho hoặc địa chỉ..."
            className="max-w-full"
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
                                    {statusValue !== "Tất cả trạng thái" ? (
                                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                                            Trạng thái:{" "}
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{statusValue}</span>
                                        </span>
                                    ) : null}
                                    {sortValue !== "Ngày tạo" ? (
                                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                                            Sắp xếp:{" "}
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{sortValue}</span>
                                        </span>
                                    ) : null}
                                    {sortDirValue !== "Giảm dần" ? (
                                        <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                                            Thứ tự:{" "}
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{sortDirValue}</span>
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
                                    value: statusValue,
                                    onChange: onStatusChange,
                                    options: [STATUS_LABEL_ACTIVE, STATUS_LABEL_INACTIVE],
                                    width: "sm:w-[180px]",
                                },
                                {
                                    label: "sắp xếp",
                                    placeholder: "Sắp xếp",
                                    value: sortValue,
                                    onChange: onSortChange,
                                    options: SORT_FIELD_OPTIONS,
                                    width: "sm:w-[170px]",
                                },
                                {
                                    label: "thứ tự",
                                    placeholder: "Thứ tự",
                                    value: sortDirValue,
                                    onChange: onSortDirChange,
                                    options: SORT_DIR_OPTIONS,
                                    width: "sm:w-[150px]",
                                },
                            ]}
                        />
                    </AdvancedFilterPanel>
                ) : null
            }
        />
    );
}
