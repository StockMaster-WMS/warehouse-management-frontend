import { memo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleOff,
  Edit2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { getProductCategoryDisplayName } from "@/lib/product-display";
import { statusTone } from "@/lib/design-system";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types/product";

type ProductTableRowProps = {
  product: Product;
  rowNumber: number;
  onRequestDelete: (target: { id: string; name: string }) => void;
  canManageProducts?: boolean;
};

function formatDate(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatStockValue(value?: number | null) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "—";
}

export const ProductTableRow = memo(function ProductTableRow({
  product,
  rowNumber,
  onRequestDelete,
  canManageProducts = false,
}: ProductTableRowProps) {
  const categoryName = getProductCategoryDisplayName(product);
  const categoryLabel =
    categoryName || (product.categoryId ? "—" : "Chưa gán danh mục");
  const categorySubline =
    !categoryName && product.categoryId ? "Danh mục chưa xác định" : "";
  const qtyOnHand = product.qtyOnHand ?? product.currentStock;
  const qtyAvailable = product.qtyAvailable ?? product.availableStock;
  const isLowStock =
    typeof qtyAvailable === "number" &&
    product.minStockQty != null &&
    qtyAvailable < product.minStockQty;

  return (
    <>
      <TableRow className="ui-table-row hidden border-0 md:table-row">
        <TableCell className="px-3 py-3 text-center align-middle">
          <span className="tabular-nums text-xs font-medium text-muted-foreground">
            {rowNumber}
          </span>
        </TableCell>
        <TableCell className="px-3 py-3 align-middle">
          <Link
            href={`/products/${product.id}`}
            className="font-mono text-xs font-semibold text-foreground hover:text-primary hover:underline"
          >
            {product.sku}
          </Link>
        </TableCell>
        <TableCell className="max-w-70 px-3 py-3 align-middle">
          <span className="line-clamp-2 text-sm font-medium text-foreground">
            {product.name}
          </span>
        </TableCell>
        <TableCell className="px-3 py-3 align-middle">
          <span className="font-mono text-xs text-muted-foreground">
            {product.barcodeEan13?.trim() || "—"}
          </span>
        </TableCell>
        <TableCell className="max-w-50 px-3 py-3 align-middle">
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm text-foreground/85">
              {categoryLabel}
            </span>
            {categorySubline ? (
              <span className="truncate font-mono text-[10px] text-muted-foreground">
                {categorySubline}
              </span>
            ) : null}
          </div>
        </TableCell>
        <TableCell className="px-3 py-3 text-center align-middle">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {product.baseUnit?.trim() || "—"}
          </span>
        </TableCell>
        <TableCell className="px-3 py-3 text-center align-middle">
          {product.primarySupplierId ? (
            <span className="text-xs font-medium text-success">
              Đã gán
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Chưa gán</span>
          )}
        </TableCell>
        <TableCell className="px-3 py-3 text-center align-middle">
          <span className="tabular-nums text-sm font-semibold text-foreground">
            {formatStockValue(qtyOnHand)}
          </span>
        </TableCell>
        <TableCell className="px-3 py-3 text-center align-middle">
          <span className={isLowStock ? "tabular-nums text-sm font-semibold text-rose-600 dark:text-rose-400" : "tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400"}>
            {formatStockValue(qtyAvailable)}
          </span>
        </TableCell>
        <TableCell className="px-3 py-3 text-center align-middle">
          <StatusBadge tone={statusTone(product.status)}>
            {product.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
          </StatusBadge>
        </TableCell>
        <TableCell className="whitespace-nowrap px-3 py-3 align-middle">
          <span className="text-xs text-muted-foreground">
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
                  className="h-8 w-8 rounded-lg"
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
              {canManageProducts ? (
                <>
                  <DropdownMenuItem
                    className="rounded-lg"
                    render={<Link href={`/products/${product.id}/edit`} />}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg text-destructive focus:text-destructive"
                    onClick={() => onRequestDelete({ id: product.id, name: product.name })}
                  >
                    <CircleOff className="mr-2 h-4 w-4" />
                    Ngừng dùng
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <TableRow className="md:hidden border-0 hover:bg-transparent">
        <TableCell colSpan={12} className="px-0 py-2 p-0 border-0">
          <div className="ui-surface m-2 p-4">
            <div className="space-y-3">
          <div className="space-y-1">
            <p className="ui-label">Mã hàng</p>
            <Link
              href={`/products/${product.id}`}
              className="font-mono text-sm font-semibold text-foreground hover:text-primary hover:underline"
            >
              {product.sku}
            </Link>
          </div>

          <div className="space-y-1">
              <p className="ui-label">Tên sản phẩm</p>
            <p className="line-clamp-2 font-medium text-foreground">
              {product.name}
            </p>
          </div>

          {product.barcodeEan13?.trim() && (
            <div className="space-y-1">
              <p className="ui-label">Mã vạch</p>
              <p className="font-mono text-xs text-muted-foreground">
                {product.barcodeEan13}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="ui-label">Danh mục</p>
              <p className="truncate text-sm text-foreground/85">{categoryLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="ui-label">Đơn vị</p>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {product.baseUnit?.trim() || "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="ui-label">Trạng thái</p>
              <StatusBadge tone={statusTone(product.status)}>
                {product.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
              </StatusBadge>
            </div>
            <div className="space-y-1">
              <p className="ui-label">NCC</p>
              <p className="text-xs font-medium">
                {product.primarySupplierId ? (
                  <span className="text-success">Đã gán</span>
                ) : (
                  <span className="text-muted-foreground">Chưa gán</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="ui-label">Tồn hiện tại</p>
              <p className="tabular-nums text-sm font-semibold">{formatStockValue(qtyOnHand)}</p>
            </div>
            <div className="space-y-1">
              <p className="ui-label">Khả dụng</p>
              <p className={isLowStock ? "tabular-nums text-sm font-semibold text-rose-600" : "tabular-nums text-sm font-semibold text-emerald-600"}>
                {formatStockValue(qtyAvailable)}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="ui-label">Cập nhật</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(product.updatedAt)}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              render={<Link href={`/products/${product.id}`} />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="flex-1 rounded-lg"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              Xem
            </Button>
            {canManageProducts ? (
              <>
                <Button
                  render={<Link href={`/products/${product.id}/edit`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-lg"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg px-3"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onRequestDelete({ id: product.id, name: product.name })}
                    >
                      <CircleOff className="mr-2 h-4 w-4" />
                      Ngừng dùng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
});
