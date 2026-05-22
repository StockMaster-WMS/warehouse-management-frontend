import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchToolbar } from "@/components/ui/search-toolbar";

interface CategoriesSearchSectionProps {
  query: string;
  onQueryChange: (value: string) => void;
  onClearQuery: () => void;
  noContainer?: boolean;
}

export function CategoriesSearchSection({
  query,
  onQueryChange,
  onClearQuery,
  noContainer = false,
}: CategoriesSearchSectionProps) {
  return (
    <SearchToolbar
      noContainer={noContainer}
      placeholder="Tìm theo tên hoặc mã nhóm..."
      value={query}
      onValueChange={onQueryChange}
      right={
        query.trim().length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full rounded-xl px-4 text-rose-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 sm:w-auto"
            onClick={onClearQuery}
          >
            <X className="mr-2 size-4" />
            Xoá lọc
          </Button>
        ) : null
      }
    />
  );
}
