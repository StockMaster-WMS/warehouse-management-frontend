import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchToolbar } from "@/components/ui/search-toolbar";

type SuppliersSearchSectionProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  hasAnyFilter: boolean;
  onClearFilters: () => void;
};

export function SuppliersSearchSection({
  searchInput,
  onSearchChange,
  hasAnyFilter,
  onClearFilters,
}: SuppliersSearchSectionProps) {
  return (
    <SearchToolbar
      placeholder="Tìm kiếm (tên, mã, email liên hệ...)"
      value={searchInput}
      onValueChange={onSearchChange}
      right={
        hasAnyFilter ? (
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-xl px-4 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            onClick={onClearFilters}
          >
            <X className="mr-2 h-4 w-4" />
            Xoa loc
          </Button>
        ) : null
      }
    />
  );
}
