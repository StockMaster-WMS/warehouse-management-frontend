import Link from "next/link";
import { ChevronDown, MoreHorizontal, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

interface CategoryTreeTableProps {
  treeModel: {
    visibleNodes: Array<{ cat: Category; treeDepth: number; hasChildren: boolean }>;
    effectiveExpandedIds: Set<string>;
    displayCount: number;
    hasQuery: boolean;
  };
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
  onToggleExpanded: (id: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  noContainer?: boolean;
  canManageCategories?: boolean;
}

export function CategoryTreeTable({
  treeModel,
  isLoading,
  isFetching,
  error,
  onRetry,
  onToggleExpanded,
  onEditCategory,
  onDeleteCategory,
  noContainer = false,
  canManageCategories = false,
}: CategoryTreeTableProps) {
  const content = (
    <>
      {isFetching && !isLoading ? (
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          Đang cập nhật dữ liệu…
        </p>
      ) : null}

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-230">
          <TableHeader className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-[35%] py-4 pl-14 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Nhóm / loại
              </TableHead>
              <TableHead className="w-[25%] py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Đường dẫn (Path)
              </TableHead>
              <TableHead className="w-[12%] py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sản phẩm
              </TableHead>
              <TableHead className="w-[13%] py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Trạng thái
              </TableHead>
              <TableHead className="w-[15%] py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tạo lúc
              </TableHead>
              <TableHead className="w-[10%] py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow
                  key={`category-skeleton-${idx}`}
                  className="border-slate-100 dark:border-slate-800"
                >
                  <TableCell className="py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Skeleton className="size-8 shrink-0 rounded-lg" />
                      <div className="min-w-0 space-y-2">
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <div className="flex justify-center">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <div className="flex justify-center">
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex justify-end">
                      <Skeleton className="size-8 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <EmptyState
                    icon={Tag}
                    title="Không thể tải nhóm hàng"
                    description="Đã xảy ra lỗi khi tải cây phân loại."
                    action={
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Thử lại
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : treeModel.visibleNodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <EmptyState
                    icon={Tag}
                    title={
                      treeModel.hasQuery
                        ? "Không có nhóm khớp tìm kiếm"
                        : "Chưa có nhóm / loại nào"
                    }
                    description={
                      treeModel.hasQuery
                        ? "Thử từ khóa khác hoặc xóa bộ lọc."
                        : "Tạo nhóm gốc hoặc loại con để gán cho sản phẩm."
                    }
                    action={
                      treeModel.hasQuery ? (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                          Làm mới
                        </Button>
                      ) : canManageCategories ? (
                        <Button
                          render={<Link href="/categories/new" />}
                          nativeButton={false}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Package className="mr-2 size-4" />
                          Thêm phân loại mới
                        </Button>
                      ) : null
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              treeModel.visibleNodes.map(({ cat, treeDepth, hasChildren }) => {
                const isExpanded = treeModel.effectiveExpandedIds.has(cat.id);

                return (
                  <TableRow
                    key={cat.id}
                    className="border-slate-100 transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:border-slate-800 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/60"
                  >
                    <TableCell className="py-4">
                      <div className="flex min-w-0 items-stretch">
                        <div className="flex shrink-0 self-stretch" aria-hidden>
                          {Array.from({ length: treeDepth }).map(
                            (_, railIdx) => (
                              <div
                                key={railIdx}
                                className="flex w-8 shrink-0 justify-center self-stretch"
                              >
                                <span className="w-px shrink-0 self-stretch bg-slate-200 dark:bg-slate-600" />
                              </div>
                            ),
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div className="flex w-8 shrink-0 justify-center">
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={() => onToggleExpanded(cat.id)}
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded ? "Thu gọn nhánh" : "Mở rộng nhánh"
                                }
                                className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-slate-700"
                              >
                                <ChevronDown
                                  className={cn(
                                    "size-4 transition-transform",
                                    isExpanded ? "rotate-0" : "-rotate-90",
                                  )}
                                />
                              </button>
                            ) : (
                              <span className="block size-8" aria-hidden />
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="flex min-w-0 items-center">
                        <span
                          className="truncate font-mono text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                          title={cat.path || "—"}
                        >
                          {cat.path || "—"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 text-center">
                      <div
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                        title="Thống kê theo nhóm — sắp cập nhật"
                      >
                        <Package className="size-3.5 opacity-70" />
                      </div>
                    </TableCell>

                    <TableCell className="py-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                        )}
                      >
                        {cat.isActive ? "Đang hoạt động" : "Tạm dừng"}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-nowrap py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(cat.createdAt)}
                    </TableCell>

                    <TableCell className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Mở hành động cho nhóm hàng ${cat.name}`}
                              className="size-8 rounded-lg"
                            >
                              <MoreHorizontal className="size-4" />
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
                          {canManageCategories ? (
                            <DropdownMenuItem
                              className="cursor-pointer rounded-lg"
                              onClick={() => onEditCategory(cat)}
                            >
                              <Tag className="mr-2 size-4" />
                              Sửa thông tin
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            className="rounded-lg"
                            render={<Link href="/products" />}
                          >
                            <Package className="mr-2 size-4" />
                            Sản phẩm
                          </DropdownMenuItem>
                          {canManageCategories ? (
                            <DropdownMenuItem
                              className="rounded-lg text-rose-600 focus:text-rose-600"
                              onClick={() => onDeleteCategory(cat)}
                            >
                              <Tag className="mr-2 size-4" />
                              Xóa nhóm hàng
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`category-card-skeleton-${idx}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
            <EmptyState
              icon={Tag}
              title="Không thể tải nhóm hàng"
              description="Đã xảy ra lỗi khi tải cây phân loại."
              action={
                <Button variant="outline" size="sm" className="h-10" onClick={onRetry}>
                  Thử lại
                </Button>
              }
            />
          </div>
        ) : treeModel.visibleNodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <EmptyState
              icon={Tag}
              title={treeModel.hasQuery ? "Không có nhóm khớp tìm kiếm" : "Chưa có nhóm / loại nào"}
              description={treeModel.hasQuery ? "Thử từ khóa khác hoặc xóa bộ lọc." : "Tạo nhóm gốc hoặc loại con để gán cho sản phẩm."}
              action={
                treeModel.hasQuery ? (
                  <Button variant="outline" size="sm" className="h-10" onClick={onRetry}>
                    Làm mới
                  </Button>
                ) : canManageCategories ? (
                  <Button
                    render={<Link href="/categories/new" />}
                    nativeButton={false}
                    size="sm"
                    className="h-10 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Package className="mr-2 size-4" />
                    Thêm phân loại mới
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          treeModel.visibleNodes.map(({ cat, treeDepth, hasChildren }) => {
            const isExpanded = treeModel.effectiveExpandedIds.has(cat.id);
            const inset = Math.min(treeDepth, 3) * 12;

            return (
              <article
                key={cat.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                style={{ marginLeft: inset }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => onToggleExpanded(cat.id)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Thu gọn nhánh" : "Mở rộng nhánh"}
                        className="flex size-10 items-center justify-center rounded-lg"
                      >
                        <ChevronDown
                          className={cn(
                            "size-5 transition-transform",
                            isExpanded ? "rotate-0" : "-rotate-90",
                          )}
                        />
                      </button>
                    ) : (
                      <Tag className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold leading-5 text-slate-900 dark:text-white">
                          {cat.name}
                        </h3>
                        <p className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                          {cat.code}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                        )}
                      >
                        {cat.isActive ? "Hoạt động" : "Tạm dừng"}
                      </span>
                    </div>

                    <p className="mt-3 truncate rounded-lg bg-slate-50 px-2 py-1.5 font-mono text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      {cat.path || "Chưa có path"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Tạo lúc: {formatDateTime(cat.createdAt)}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                        <Package className="size-3.5 opacity-70" />
                        Sản phẩm
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="outline" size="icon-lg" className="size-10 rounded-lg">
                              <span className="sr-only">Mở hành động cho nhóm hàng {cat.name}</span>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Nhóm / loại</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          {canManageCategories ? (
                            <DropdownMenuItem
                              className="cursor-pointer rounded-lg"
                              onClick={() => onEditCategory(cat)}
                            >
                              <Tag className="mr-2 size-4" />
                              Sửa thông tin
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem className="rounded-lg" render={<Link href="/products" />}>
                            <Package className="mr-2 size-4" />
                            Sản phẩm
                          </DropdownMenuItem>
                          {canManageCategories ? (
                            <DropdownMenuItem
                              className="rounded-lg text-rose-600 focus:text-rose-600"
                              onClick={() => onDeleteCategory(cat)}
                            >
                              <Tag className="mr-2 size-4" />
                              Xóa nhóm hàng
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );

  if (noContainer) {
    return content;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {content}
    </div>
  );
}
