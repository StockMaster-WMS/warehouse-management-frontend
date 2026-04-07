"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrMessage } from "@/types/api";
import type { Supplier } from "@/types/supplier";
import { useGetPurchaseOrdersQuery } from "@/store/services/purchase-order.service";

const PO_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  APPROVED: "Đã duyệt",
  PARTIAL: "Nhận một phần",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function poStatusClass(s: string): string {
  switch (s) {
    case "DRAFT":
      return "bg-slate-100 text-slate-600";
    case "APPROVED":
      return "bg-blue-100 text-blue-700";
    case "PARTIAL":
      return "bg-amber-100 text-amber-700";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
};

export function SupplierHistoryDialog({ open, onOpenChange, supplier }: Props) {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useGetPurchaseOrdersQuery(
    {
      page,
      size: 10,
      supplierId: supplier?.id ?? "",
      sort: "createdAt",
      sortDir: "desc",
    },
    { skip: !open || !supplier?.id },
  );

  const rows = data?.data?.content ?? [];
  const totalPages = data?.data?.total_pages ?? 0;
  const totalElements = data?.data?.total_elements ?? 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setPage(0);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lịch sử nhập hàng — {supplier?.name ?? ""}</DialogTitle>
          <p className="text-xs text-slate-500">
            Mã: {supplier?.code} · Tổng: {totalElements} đơn
          </p>
        </DialogHeader>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mã PO
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ngày đặt
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ngày dự kiến
                </TableHead>
                <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tổng tiền
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-3 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-rose-500"
                  >
                    {apiErrMessage(error)}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="Chưa có đơn nhập hàng"
                      description="Nhà cung cấp này chưa có đơn mua hàng nào."
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {po.poNumber}
                    </TableCell>
                    <TableCell className="text-xs">
                      {po.orderDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {po.expectedDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {po.totalAmount != null
                        ? Number(po.totalAmount).toLocaleString("vi-VN") + " đ"
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`font-normal ${poStatusClass(po.status ?? "")}`}
                      >
                        {PO_STATUS_LABEL[po.status ?? ""] ?? po.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        render={<Link href={`/purchase-orders/${po.id}`} />}
                        nativeButton={false}
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Trang {page + 1}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
