import { memo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Edit2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types/product";
import { getProductCategoryDisplayName } from "@/types/product";

type ProductTableRowProps = {
  product: Product;
  rowNumber: number;
  onRequestDelete: (name: string) => void;
};

function formatDate(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
}

export const ProductTableRow = memo(function ProductTableRow({
  product,
  rowNumber,
  onRequestDelete,
}: ProductTableRowProps) {
  const categoryName = getProductCategoryDisplayName(product);
  const categoryLabel =
    categoryName || (product.categoryId ? "—" : "Chưa gán danh mục");
  const categorySubline =
    !categoryName && product.categoryId ? `ID: ${product.categoryId}` : "";

  return (
    <TableRow className="group transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70">
      <TableCell className="px-3 py-3 text-center align-middle">
        <span className="tabular-nums text-xs font-medium text-slate-500 dark:text-slate-400">
          {rowNumber}
        </span>
      </TableCell>
      <TableCell className="px-3 py-3 align-middle">
        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
          {product.sku}
        </span>
      </TableCell>
      <TableCell className="max-w-[280px] px-3 py-3 align-middle">
        <span className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
          {product.name}
        </span>
      </TableCell>
      <TableCell className="px-3 py-3 align-middle">
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {product.barcodeEan13?.trim() || "—"}
        </span>
      </TableCell>
      <TableCell className="max-w-[200px] px-3 py-3 align-middle">
        <div className="flex flex-col gap-0.5">
          <span className="truncate text-sm text-slate-700 dark:text-slate-200">
            {categoryLabel}
          </span>
          {categorySubline ? (
            <span className="truncate font-mono text-[10px] text-slate-400">
              {categorySubline}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="px-3 py-3 text-center align-middle">
        <span className="text-xs font-medium uppercase text-slate-600 dark:text-slate-300">
          {product.baseUnit?.trim() || "—"}
        </span>
      </TableCell>
      <TableCell className="px-3 py-3 text-center align-middle">
        {product.primarySupplierId ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Đã gán
          </span>
        ) : (
          <span className="text-xs text-slate-400">Chưa gán</span>
        )}
      </TableCell>
      <TableCell className="px-3 py-3 text-center align-middle">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            product.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {product.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap px-3 py-3 align-middle">
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {formatDate(product.updatedAt)}
        </span>
      </TableCell>
      <TableCell className="px-3 py-3 text-right align-middle">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Hành động cho sản phẩm ${product.name}`}
                className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuItem
              className="rounded-lg"
              render={<Link href={`/products/${product.id}`} />}
            >
              <ChevronRight className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg"
              render={<Link href={`/products/${product.id}/edit`} />}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-rose-600 focus:text-rose-600"
              onClick={() => onRequestDelete(product.name)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa SKU
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
