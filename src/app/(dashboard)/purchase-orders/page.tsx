"use client";

import Link from "next/link";
import { Loader2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_BASE_URL } from "@/lib/constants";
import { useGetPurchaseOrdersQuery } from "@/store/services/purchase-order.service";
import { apiErrMessage, apiErrStatus } from "@/types/api";
import type { PurchaseOrder } from "@/types/purchase-order";

export default function PurchaseOrdersPage() {
  const { data, isLoading, isError, error } = useGetPurchaseOrdersQuery({ page: 0, size: 50 });

  const rows = data?.data?.content ?? [];
  const errStatus = isError ? apiErrStatus(error) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn nhập hàng"
        description="Purchase Order — quản lý đơn đặt hàng từ nhà cung cấp."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              render={<Link href="/putaway" />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="border-slate-200"
            >
              Putaway
            </Button>
            <Button
              render={<Link href="/purchase-orders/new" />}
              nativeButton={false}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn nhập
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải danh sách…
          </div>
        ) : isError ? (
          <div className="p-8 text-left text-sm">
            <p className="font-semibold text-rose-700 dark:text-rose-400">Không tải được danh sách đơn nhập</p>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              {apiErrMessage(error, "Lỗi mạng hoặc máy chủ từ chối yêu cầu.")}
            </p>
            {errStatus != null ? (
              <p className="mt-1 text-xs text-slate-500">
                Mã phản hồi: <span className="font-mono">{String(errStatus)}</span>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              Kiểm tra NEXT_PUBLIC_API_BASE / rewrite Next.js; tránh đường dẫn lặp /api/api/…
            </p>
            <pre className="mt-3 max-h-36 overflow-auto rounded border border-slate-100 bg-slate-50 p-2 text-left text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              {(() => {
                try {
                  return JSON.stringify(error, null, 2);
                } catch {
                  return String(error);
                }
              })()}
            </pre>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-500">
            <FileText className="h-10 w-10 opacity-40" />
            <p className="text-sm">Chưa có đơn nhập hoặc API trả về rỗng.</p>
            <Button render={<Link href="/purchase-orders/new" />} nativeButton={false} size="sm">
              Tạo đơn đầu tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Mã PO</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead>Dự kiến</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((po: PurchaseOrder) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.orderDate}</TableCell>
                    <TableCell>{po.expectedDate ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {po.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        render={<Link href={`/purchase-orders/${po.id}`} />}
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600"
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
