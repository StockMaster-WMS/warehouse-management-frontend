import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { StockExpanded } from "@/types/stock";

type LowStockTableProps = {
  items: StockExpanded[];
  isLoading: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={`sk-${i}`}>
          {Array.from({ length: 8 }).map((__, j) => (
            <TableCell key={`sk-${i}-${j}`} className="px-3 py-3">
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function LowStockTable({
  items,
  isLoading,
  errorMessage,
  onRetry,
}: LowStockTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm dark:border-amber-900/40 dark:bg-slate-900">
      <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-2.5 dark:border-amber-900/30 dark:bg-amber-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Cảnh báo tồn kho thấp — {items.length} mục
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-200 text-left">
          <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <TableRow>
              <TableHead className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                STT
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kho
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Vị trí
              </TableHead>
              <TableHead className="min-w-45 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sản phẩm
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tồn tay
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Giữ chỗ
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Khả dụng
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tồn tối thiểu
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <TableSkeleton />
            ) : errorMessage ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải dữ liệu"
                    description={errorMessage}
                    action={
                      onRetry ? (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                          Thử lại
                        </Button>
                      ) : undefined
                    }
                    className="py-10"
                  />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không có mục tồn kho thấp"
                    description="Tất cả sản phẩm đều trên mức tồn tối thiểu."
                    className="py-10"
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "group transition-colors",
                    "odd:bg-white even:bg-slate-50/40 hover:bg-amber-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70",
                  )}
                >
                  <TableCell className="px-3 py-3 text-center">
                    <span className="tabular-nums text-xs font-medium text-slate-500">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.warehouse?.name ?? item.warehouse?.code ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {item.location?.code ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.product?.name ?? "—"}
                      </div>
                      <div className="text-xs text-slate-500">{item.product?.sku ?? "—"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span className="tabular-nums text-sm font-bold text-slate-900 dark:text-white">
                      {item.qtyOnHand.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span className="tabular-nums text-sm font-medium text-amber-600 dark:text-amber-400">
                      {item.qtyReserved.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span className="tabular-nums text-sm font-bold text-rose-600 dark:text-rose-400">
                      {item.qtyAvailable.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                      {item.product?.minQty?.toLocaleString("vi-VN") ?? "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
