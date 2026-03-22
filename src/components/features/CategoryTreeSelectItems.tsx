"use client";

import { useMemo } from "react";
import { CornerDownRight } from "lucide-react";

import type { Category } from "@/store/services/category.service";
import { SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CATEGORY_TREE_INDENT_STEP_PX,
  flattenCategoriesTreeOrder,
} from "@/lib/category-select-tree";

type CategoryTreeSelectItemsProps = {
  categories: Category[];
  excludeIds?: Set<string>;
  itemClassName?: string;
};

export function CategoryTreeSelectItems({
  categories,
  excludeIds,
  itemClassName,
}: CategoryTreeSelectItemsProps) {
  const rows = useMemo(() => {
    const flat = flattenCategoriesTreeOrder(categories);
    if (!excludeIds?.size) return flat;
    return flat.filter((r) => !excludeIds.has(r.category.id));
  }, [categories, excludeIds]);

  return (
    <>
      {rows.map(({ category, depth }) => (
        <SelectItem
          key={category.id}
          value={category.id}
          className={cn("rounded-lg", itemClassName)}
        >
          <span className="flex min-w-0 items-center gap-1">
            <span
              className="flex shrink-0 items-end justify-end"
              style={{ width: depth * CATEGORY_TREE_INDENT_STEP_PX }}
              aria-hidden
            >
              {depth > 0 ? (
                <CornerDownRight className="mb-0.5 size-3.5 shrink-0 text-muted-foreground/55" />
              ) : null}
            </span>
            <span className="min-w-0 break-words">
              {category.name}{" "}
              <span className="font-mono text-xs text-muted-foreground">
                ({category.code})
              </span>
            </span>
          </span>
        </SelectItem>
      ))}
    </>
  );
}
