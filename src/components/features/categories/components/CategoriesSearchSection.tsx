import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchToolbar } from "@/components/ui/search-toolbar";

interface CategoriesSearchSectionProps {
  query: string;
  onQueryChange: (value: string) => void;
  onClearQuery: () => void;
}

export function CategoriesSearchSection({
  query,
  onQueryChange,
  onClearQuery,
}: CategoriesSearchSectionProps) {
  return (
    <SearchToolbar
      placeholder="Tìm theo tên hoặc mã nhóm..."
      value={query}
      onValueChange={onQueryChange}
      right={
        query.trim().length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-xl px-4 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            onClick={onClearQuery}
          >
            <X className="mr-2 h-4 w-4" />
            Xoá lọc
          </Button>
        ) : null
      }
    />
  );
}
