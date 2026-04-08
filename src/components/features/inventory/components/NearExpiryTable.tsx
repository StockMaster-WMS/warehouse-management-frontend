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
import type { NearExpiryStockResponse } from "@/types/stock";
import { formatDate } from "@/components/features/inventory/utils";

type NearExpiryTableProps = {
  items: NearExpiryStockResponse[];
  isLoading: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={`sk-${i}`}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={`sk-${i}-${j}`} className="px-3 py-3">
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function DaysLeftBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <Badge variant="destructive" className="text-xs">
        Đã hết hạn ({Math.abs(days)} ngày)
      </Badge>
    );
  }
  if (days <= 7) {
    return (
      <Badge variant="destructive" className="text-xs">
        {days} ngày
      </Badge>
    );
  }
  if (days <= 30) {
    return (
      <Badge className="border-none bg-amber-100 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        {days} ngày
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      {days} ngày
    </Badge>
  );
}

export function NearExpiryTable({
  items,
  isLoading,
  errorMessage,
  onRetry,
}: NearExpiryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm dark:border-rose-900/40 dark:bg-slate-900">
      <div className="border-b border-rose-100 bg-rose-50/60 px-4 py-2.5 dark:border-rose-900/30 dark:bg-rose-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
          Hàng sắp hết hạn — {items.length} mục
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-175 text-left">
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
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lô
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hạn sử dụng
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Còn lại
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tồn tay
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Khả dụng
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
                    title="Không có hàng sắp hết hạn"
                    description="Không có sản phẩm nào sắp hết hạn trong khoảng thời gian được chọn."
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
                    "odd:bg-white even:bg-slate-50/40 hover:bg-rose-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70",
                  )}
                >
                  <TableCell className="px-3 py-3 text-center">
                    <span className="tabular-nums text-xs font-medium text-slate-500">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.warehouseCode}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {item.locationCode}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {item.lotNumber || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        item.daysLeft <= 7
                          ? "text-rose-600 dark:text-rose-400"
                          : item.daysLeft <= 30
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-600 dark:text-slate-400",
                      )}
                    >
                      {formatDate(item.expiryDate)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <DaysLeftBadge days={item.daysLeft} />
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span className="tabular-nums text-sm font-bold text-slate-900 dark:text-white">
                      {item.qtyOnHand.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span className="tabular-nums text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {item.qtyAvailable.toLocaleString("vi-VN")}
                    </span>
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
