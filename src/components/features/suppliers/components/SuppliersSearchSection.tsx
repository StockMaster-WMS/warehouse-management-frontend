import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";

type SuppliersSearchSectionProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  hasAnyFilter: boolean;
  onClearFilters: () => void;
  isFetching?: boolean;
  onRefresh?: () => void;
  noContainer?: boolean;
};

export function SuppliersSearchSection({
  searchInput,
  onSearchChange,
  hasAnyFilter,
  onClearFilters,
  isFetching = false,
  onRefresh,
  noContainer = false,
}: SuppliersSearchSectionProps) {
  return (
    <SearchToolbar
      noContainer={noContainer}
      placeholder="Tìm kiếm (tên, mã, email liên hệ...)"
      value={searchInput}
      onValueChange={onSearchChange}
      right={
        <>
          {onRefresh ? <TableRefreshButton isFetching={isFetching} onRefresh={onRefresh} /> : null}
          {hasAnyFilter ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl px-4 text-rose-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              onClick={onClearFilters}
            >
              <X className="mr-2 size-4" />
              Xoá lọc
            </Button>
          ) : null}
        </>
      }
    />
  );
}
