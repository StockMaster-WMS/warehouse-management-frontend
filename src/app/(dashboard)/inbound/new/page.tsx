"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { PurchaseOrder } from "@/types/purchase-order";
import {
  useConfirmPurchaseOrderMutation,
  useGetPurchaseOrdersQuery,
} from "@/store/services/purchase-order.service";

export default function NewInboundReceiptPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");

  // In this project, "Tạo phiếu nhập" maps to confirming a PO (DRAFT -> RECEIVING).
  // The actual receive/putaway happens on `purchase-orders/[id]`.
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetPurchaseOrdersQuery({
      page,
      size: 20,
      status: "DRAFT",
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
    });

  const rows = data?.data?.content ?? [];
  const pagedBody = data?.data;

  const paged = useMemo((): Pick<
    PagedResponse<PurchaseOrder>,
    "page" | "size" | "total_elements" | "total_pages"
  > | null => {
    if (
      !pagedBody ||
      typeof pagedBody.page !== "number" ||
      typeof pagedBody.total_pages !== "number"
    )
      return null;
    return {
      page: pagedBody.page,
      size: pagedBody.size,
      total_elements: pagedBody.total_elements,
      total_pages: pagedBody.total_pages,
    };
  }, [pagedBody]);

  const canGoPrev = page > 0;
  const canGoNext =
    paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;

  const [confirmPo, { isLoading: confirming }] =
    useConfirmPurchaseOrderMutation();

  async function handleCreateReceipt(poId: string) {
    try {
      const res = await confirmPo(poId).unwrap();
      if (!res.success) {
        toast.error(res.message || "Tạo phiếu nhập thất bại");
        return;
      }
      toast.success(res.message || "Đã tạo phiếu nhập (sang RECEIVING)");
      router.push(`/purchase-orders/${poId}`);
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Tạo phiếu nhập"
        description="Chọn PO ở trạng thái DRAFT và Confirm PO để bắt đầu nhận hàng."
        actions={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
            onClick={() => router.push("/inbound")}
          >
            <FileText className="h-4 w-4" />
          </Button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <FileText className="h-4 w-4 text-indigo-500" />
          PO DRAFT
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              placeholder="Tìm theo mã PO..."
              className="pr-2"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setKeyword("");
              setPage(0);
              refetch();
            }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <Table className="min-w-215 text-left">
            <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <TableRow>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã PO</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày đặt</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Dự kiến</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`po-draft-skel-${i}`}>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách PO"
                      description={apiErrMessage(error)}
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                        >
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="Chưa có PO DRAFT"
                      description="Không có đơn nhập nào ở trạng thái DRAFT để tạo phiếu nhập."
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((po: PurchaseOrder) => (
                  <TableRow key={po.id} className="group transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70">
                    <TableCell className="px-3 py-3 font-medium">{po.poNumber}</TableCell>
                    <TableCell className="px-3 py-3">{po.orderDate}</TableCell>
                    <TableCell className="px-3 py-3">{po.expectedDate ?? "—"}</TableCell>
                    <TableCell className="px-3 py-3">{po.status ?? "DRAFT"}</TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={confirming}
                        onClick={() => handleCreateReceipt(po.id)}
                      >
                        {confirming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý
                          </>
                        ) : (
                          "Tạo phiếu nhập"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {paged && paged.total_pages > 1 ? (
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="text-xs text-slate-500">
              Hiển thị {rows.length}/{paged.total_elements} PO
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canGoPrev || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canGoNext || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
