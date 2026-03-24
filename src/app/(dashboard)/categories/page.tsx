"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Package,
  Tag,
  FolderTree,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { apiErrMessage } from "@/types/api";

export default function CategoriesPage() {
  const [query, setQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");
  const { data, error, isLoading, isFetching, refetch } = useGetCategoriesQuery();

  const categories = useMemo(() => data?.data?.content ?? [], [data]);

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
    for (const [, list] of map.entries()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
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

    /** `treeDepth`: 0 = gốc, +1 mỗi lần đi xuống con trong cây UI (chỉ đệ quy, không đọc level API). */
    const visibleNodes: Array<{
      cat: (typeof categories)[number];
      treeDepth: number;
      hasChildren: boolean;
    }> = [];

    const walk = (cat: (typeof categories)[number], treeDepth: number) => {
      const shouldShow = !hasQuery || visibleSet!.has(cat.id);
      const children = childrenByParentId.get(cat.id) ?? [];
      const hasChildren = children.length > 0;

      if (shouldShow) {
        visibleNodes.push({ cat, treeDepth, hasChildren });
      }

      if (hasChildren && effectiveExpandedIds.has(cat.id)) {
        for (const child of children) walk(child, treeDepth + 1);
      }
    };

    if (!hasQuery) {
      for (const root of roots) walk(root, 0);
    } else {
      for (const root of roots) {
        walk(root, 0);
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
        description="Cây phân loại: nhóm gốc và loại con — dùng khi gán sản phẩm và báo cáo."
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
        placeholder="Tìm theo tên hoặc mã nhóm..."
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
          <div
            role="tree"
            aria-label="Cây nhóm và loại hàng"
            className="min-w-[720px]"
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`category-skeleton-${idx}`}
                  className="grid grid-cols-[minmax(0,1fr)_8rem_9rem_3rem] items-center gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-800"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
              ))
            ) : error ? (
              <EmptyState
                icon={Tag}
                title="Không thể tải nhóm hàng"
                description={apiErrMessage(error, "Đã xảy ra lỗi khi tải cây phân loại.")}
                action={
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Thử lại
                  </Button>
                }
                className="py-10"
              />
            ) : treeModel.visibleNodes.length === 0 ? (
              <EmptyState
                icon={Tag}
                title={query ? "Không có nhóm khớp tìm kiếm" : "Chưa có nhóm / loại nào"}
                description={
                  query
                    ? "Thử từ khóa khác hoặc xóa bộ lọc."
                    : "Tạo nhóm gốc hoặc loại con để gán cho sản phẩm."
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
            ) : (
              <>
                <div
                  className="grid grid-cols-[minmax(0,1fr)_8rem_9rem_3rem] items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50"
                  aria-hidden
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nhóm / loại
                  </div>
                  <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sản phẩm
                  </div>
                  <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Trạng thái
                  </div>
                  <div className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="sr-only">Thao tác</span>
                  </div>
                </div>
                {treeModel.visibleNodes.map(({ cat, treeDepth, hasChildren }) => {
                  const isExpanded = treeModel.effectiveExpandedIds.has(cat.id);

                  return (
                    <div
                      key={cat.id}
                      role="treeitem"
                      aria-level={treeDepth + 1}
                      aria-expanded={hasChildren ? isExpanded : undefined}
                      className="group grid grid-cols-[minmax(0,1fr)_8rem_9rem_3rem] items-center gap-2 border-b border-slate-100 px-6 py-4 transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/80 dark:border-slate-800 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex min-w-0 items-stretch">
                        {/* Mỗi cấp rộng bằng ô mũi tên (w-8); kẻ dọc giữa cột để thẳng hàng với chevron cha */}
                        <div className="flex shrink-0 self-stretch" aria-hidden>
                          {Array.from({ length: treeDepth }).map((_, railIdx) => (
                            <div
                              key={railIdx}
                              className="flex w-8 shrink-0 justify-center self-stretch"
                            >
                              <span className="w-px shrink-0 self-stretch bg-slate-200 dark:bg-slate-600" />
                            </div>
                          ))}
                        </div>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div className="flex w-8 shrink-0 justify-center">
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(cat.id)}
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded ? "Thu gọn nhánh" : "Mở rộng nhánh"
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-slate-700"
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isExpanded ? "rotate-0" : "-rotate-90",
                                  )}
                                />
                              </button>
                            ) : (
                              <span className="block h-8 w-8" aria-hidden />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                                Mã: {cat.code}
                              </span>
                              {cat.path ? (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">·</span>
                                  <span className="line-clamp-1 font-mono text-[10px] text-slate-400">
                                    {cat.path}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                          title="Thống kê theo nhóm — sắp cập nhật"
                        >
                          <Package className="h-3.5 w-3.5 opacity-70" />
                          —
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cat.isActive
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {cat.isActive ? "Đang hoạt động" : "Tạm dừng"}
                        </span>
                      </div>

                      <div className="flex justify-end">
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
                              <DropdownMenuLabel>Nhóm / loại</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuItem
                              className="rounded-lg"
                              render={<Link href={`/categories/${cat.id}/edit`} />}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Sửa thông tin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
                              render={<Link href="/products" />}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Sản phẩm
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
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
        }}
        itemName={itemToDelete}
        title="Xóa nhóm hàng"
        description="Xóa nhóm hàng sẽ ảnh hưởng đến việc phân loại các sản phẩm hiện có. Hãy kiểm tra kỹ trước khi thực hiện."
      />
    </div>
  );
}
