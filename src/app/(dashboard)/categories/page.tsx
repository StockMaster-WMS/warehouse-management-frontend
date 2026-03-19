"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import Link from "next/link";

import { 
  Plus, 
  MoreHorizontal, 
  ChevronRight, 
  Package, 
  Tag, 
  FolderTree,
  Edit2,
  Trash2,
  LayoutGrid,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { useGetCategoriesQuery } from "@/store/services/category.service";

export default function CategoriesPage() {
  const [query, setQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");
  const { data, error, isLoading, isFetching, refetch } = useGetCategoriesQuery();

  const categories = useMemo(() => data?.data ?? [], [data]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const categoriesById = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, typeof categories>();
    categories.forEach((cat) => {
      const parentId = cat.parentId ?? "";
      if (!parentId) return;
      const prev = map.get(parentId) ?? [];
      prev.push(cat);
      map.set(parentId, prev);
    });
    // Optional: sort children by level then name for stable rendering
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => {
        const dl = (a.level ?? 0) - (b.level ?? 0);
        if (dl !== 0) return dl;
        return a.name.localeCompare(b.name, "vi");
      });
      map.set(key, list);
    }
    return map;
  }, [categories]);

  const roots = useMemo(() => categories.filter((c) => !c.parentId), [categories]);

  useEffect(() => {
    if (expandedIds.size > 0) return;
    if (roots.length === 0) return;
    setExpandedIds(new Set(roots.map((r) => r.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roots]);

  const treeModel = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasQuery = q.length > 0;

    const matchedIds = new Set<string>();
    if (hasQuery) {
      for (const cat of categories) {
        const name = cat.name?.toLowerCase() ?? "";
        const code = cat.code?.toLowerCase() ?? "";
        if (name.includes(q) || code.includes(q)) matchedIds.add(cat.id);
      }
    }

    const ancestorIds = new Set<string>();
    if (hasQuery) {
      for (const id of matchedIds) {
        let cur = categoriesById.get(id);
        while (cur?.parentId) {
          ancestorIds.add(cur.parentId);
          cur = categoriesById.get(cur.parentId);
        }
      }
    }

    const effectiveExpandedIds = new Set(expandedIds);
    if (hasQuery) {
      for (const id of ancestorIds) effectiveExpandedIds.add(id);
    }

    const visibleSet = hasQuery ? new Set<string>([...matchedIds, ...ancestorIds]) : null;

    const computeDepth = (cat: (typeof categories)[number]) => {
      if (cat.level != null) return cat.level;
      let depth = 0;
      let cur: (typeof categories)[number] | undefined = cat;
      while (cur?.parentId) {
        depth += 1;
        cur = categoriesById.get(cur.parentId);
        if (!cur) break;
        if (depth > 20) break;
      }
      return depth;
    };

    const visibleNodes: Array<{
      cat: (typeof categories)[number];
      depth: number;
      hasChildren: boolean;
    }> = [];

    const walk = (cat: (typeof categories)[number]) => {
      const shouldShow = !hasQuery || visibleSet!.has(cat.id);
      const depth = computeDepth(cat);
      const children = childrenByParentId.get(cat.id) ?? [];
      const hasChildren = children.length > 0;

      if (shouldShow) {
        visibleNodes.push({ cat, depth, hasChildren });
      }

      if (hasChildren && effectiveExpandedIds.has(cat.id)) {
        for (const child of children) walk(child);
      }
    };

    if (!hasQuery) {
      for (const root of roots) walk(root);
    } else {
      for (const root of roots) {
        // If query mode: still only traverse into branches that are expanded (auto expanded ancestors)
        walk(root);
      }
    }

    const displayCount = hasQuery ? matchedIds.size : categories.length;
    return { visibleNodes, effectiveExpandedIds, displayCount, hasQuery };
  }, [categories, categoriesById, childrenByParentId, expandedIds, query, roots]);

  const stats = useMemo(() => {
    const total = categories.length;
    const rootCategories = categories.filter((cat) => !cat.parentId).length;
    const childCategories = total - rootCategories;
    return [
      { label: "Tổng nhóm hàng", value: String(total), icon: FolderTree, color: "text-indigo-500" },
      { label: "Nhóm cấp gốc", value: String(rootCategories), icon: Tag, color: "text-emerald-500" },
      { label: "Nhóm con", value: String(childCategories), icon: Tag, color: "text-slate-400" },
      { label: "Đang hiển thị", value: String(treeModel.displayCount), icon: Package, color: "text-blue-500" },
    ];
  }, [categories, treeModel.displayCount]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhóm / loại hàng"
        description="Quản lý cây danh mục và nhóm sản phẩm trong hệ thống."
        actions={
          <Button
            render={<Link href="/categories/new" />}
            nativeButton={false} 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm phân loại mới
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <SearchToolbar 
        placeholder="Tìm kiếm nhóm hàng..." 
        value={query}
        onValueChange={setQuery}
        filters={
          query.trim().length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-xl px-4 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              onClick={() => setQuery("")}
            >
              <X className="mr-2 h-4 w-4" />
              Xoá lọc
            </Button>
          )
        }
      />
        
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu...
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Tên nhóm & Mô tả</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Số lượng SP</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`category-skeleton-${idx}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-56" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="mx-auto h-6 w-20 rounded-lg" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="mx-auto h-5 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <EmptyState
                      icon={Tag}
                      title="Không thể tải danh mục"
                      description={
                        (error as { data?: { message?: string } })?.data?.message ??
                        "Đã xảy ra lỗi khi tải danh sách danh mục."
                      }
                      action={
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </td>
                </tr>
              ) : treeModel.visibleNodes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <EmptyState
                      icon={Tag}
                      title={query ? "Không tìm thấy danh mục" : "Chưa có danh mục nào"}
                      description={
                        query
                          ? "Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm."
                          : "Bắt đầu bằng cách tạo danh mục đầu tiên."
                      }
                      action={
                        query ? (
                          <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                            Xóa lọc
                          </Button>
                        ) : (
                          <Button
                            render={<Link href="/categories/new" />}
                            nativeButton={false}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm phân loại mới
                          </Button>
                        )
                      }
                      className="py-10"
                    />
                  </td>
                </tr>
              ) : (
                treeModel.visibleNodes.map(({ cat, depth, hasChildren }) => {
                  const isExpanded = treeModel.effectiveExpandedIds.has(cat.id);
                  return (
                    <tr
                      key={cat.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div
                          className="flex items-center gap-3"
                          style={{ paddingLeft: depth * 12 }}
                        >
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(cat.id)}
                              aria-label={isExpanded ? "Thu gọn nhánh" : "Mở rộng nhánh"}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300"
                            >
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${
                                  isExpanded ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                          ) : (
                            <span className="inline-flex h-7 w-7" />
                          )}

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                            <LayoutGrid className="h-5 w-5" />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {cat.name}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1">
                              {cat.path ? `Path: ${cat.path}` : `Mã danh mục: ${cat.code}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                          <Package className="h-3.5 w-3.5" />
                          --
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cat.isActive
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {cat.isActive ? "Đang hoạt động" : "Tạm dừng"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8 rounded-lg"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl"
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>
                                Quản lý nhóm
                              </DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuItem
                              className="rounded-lg"
                              render={<Link href={`/categories/${cat.id}/edit`} />}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Sửa thông tin
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg">
                              <ChevronRight className="mr-2 h-4 w-4" />
                              Xem sản phẩm
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
                              render={<Link href={`/categories/${cat.id}`} />}
                            >
                              <ChevronRight className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg text-rose-600 focus:text-rose-600"
                              onClick={() => {
                                setItemToDelete(cat.name);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa nhóm hàng
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          console.log("Deleted", itemToDelete);
        }}
        itemName={itemToDelete}
        title="Xóa nhóm hàng"
        description="Xóa nhóm hàng sẽ ảnh hưởng đến việc phân loại các sản phẩm hiện có. Hãy kiểm tra kỹ trước khi thực hiện."
      />
    </div>
  );
}
