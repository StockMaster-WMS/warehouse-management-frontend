import type { Category } from "@/types/category";

/** Cùng bước thụt với `CategoryTreeSelectItems` (dropdown chọn nhóm). */
export const CATEGORY_TREE_INDENT_STEP_PX = 14;

export type CategoryTreeRow = {
  category: Category;
  depth: number;
};

/** DFS preorder, sắp tên `vi`; độ sâu từ quan hệ cha–con (không dùng `level` API). */
export function flattenCategoriesTreeOrder(categories: Category[]): CategoryTreeRow[] {
  const childrenByParentId = new Map<string, Category[]>();
  for (const cat of categories) {
    const pid = cat.parentId ?? "";
    if (!pid) continue;
    const list = childrenByParentId.get(pid) ?? [];
    list.push(cat);
    childrenByParentId.set(pid, list);
  }
  for (const [, list] of childrenByParentId) {
    list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }

  const roots = categories.filter((c) => !c.parentId);
  roots.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  const out: CategoryTreeRow[] = [];
  const walk = (cat: Category, depth: number) => {
    out.push({ category: cat, depth });
    const kids = childrenByParentId.get(cat.id) ?? [];
    for (const k of kids) walk(k, depth + 1);
  };
  for (const r of roots) walk(r, 0);
  return out;
}
