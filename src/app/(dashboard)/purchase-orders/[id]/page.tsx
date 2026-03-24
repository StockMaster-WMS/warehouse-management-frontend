"use client";

import Link from "next/link";
import { use, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  useGetPoItemsQuery,
  useGetPurchaseOrderByIdQuery,
  useReceivePoItemMutation,
} from "@/store/services/purchase-order.service";
import type { PoItem } from "@/types/purchase-order";

const receiveSchema = z.object({
  qtyStr: z.string().min(1, "Nhập số lượng nhận"),
  suggestedLocationId: z.string().optional(),
});

export default function PurchaseOrderDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);

  const { data: poRes, isLoading: poLoading, isError: poError } = useGetPurchaseOrderByIdQuery(id, { skip: !id });
  const { data: itemsRes, isFetching: itemsLoading } = useGetPoItemsQuery(
    { purchaseOrderId: id },
    { skip: !id }
  );

  const po = poRes?.data;
  const lines = itemsRes?.data?.content ?? [];

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PoItem | null>(null);
  const [qtyStr, setQtyStr] = useState("");
  const [suggestedLocationId, setSuggestedLocationId] = useState("");
  const [receiveErrors, setReceiveErrors] = useState<Record<string, string>>({});

  const [receivePoItem, { isLoading: receiving }] = useReceivePoItemMutation();

  function openReceive(item: PoItem) {
    setActiveItem(item);
    setQtyStr("");
    setSuggestedLocationId("");
    setReceiveErrors({});
    setReceiveOpen(true);
  }

  async function submitReceive(e: React.FormEvent) {
    e.preventDefault();
    if (!activeItem || !id) return;
    setReceiveErrors({});
    const parsed = receiveSchema.safeParse({ qtyStr, suggestedLocationId: suggestedLocationId || undefined });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!err[k]) err[k] = issue.message;
      }
      setReceiveErrors(err);
      return;
    }
    const qty = Number(parsed.data.qtyStr.replace(",", "."));
    if (!(qty > 0) || Number.isNaN(qty)) {
      setReceiveErrors({ qtyStr: "Số lượng phải > 0" });
      toast.error("Số lượng phải > 0");
      return;
    }

    try {
      const res = await receivePoItem({
        poItemId: activeItem.id,
        purchaseOrderId: id,
        body: {
          qty,
          ...(parsed.data.suggestedLocationId?.trim()
            ? { suggestedLocationId: parsed.data.suggestedLocationId.trim() }
            : {}),
        },
      }).unwrap();

      if (!res.success) {
        toast.error((res as { message?: string }).message || "Nhận hàng thất bại");
        return;
      }
      toast.success((res as { message?: string }).message || "Đã ghi nhận hàng");
      setReceiveOpen(false);
      setActiveItem(null);
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  }

  if (!id) {
    return <p className="text-sm text-rose-600">Thiếu mã đơn.</p>;
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Chi tiết đơn nhập"
        description={po ? `Mã PO: ${po.poNumber}` : "Đang tải…"}
        actions={
          <Button
            render={<Link href="/purchase-orders" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      {poLoading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải đơn…
        </div>
      ) : poError || !po ? (
        <p className="text-sm text-rose-600">Không tải được đơn (GET /api/purchase-orders/{"{id}"}).</p>
      ) : (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
          <div>
            <span className="text-slate-500">Trạng thái</span>
            <div className="mt-1">
              <Badge variant="secondary">{po.status ?? "—"}</Badge>
            </div>
          </div>
          <div>
            <span className="text-slate-500">Ngày đặt</span>
            <p className="mt-1 font-medium">{po.orderDate}</p>
          </div>
          <div>
            <span className="text-slate-500">Ngày dự kiến</span>
            <p className="mt-1">{po.expectedDate ?? "—"}</p>
          </div>
          <div>
            <span className="text-slate-500">Tổng tiền</span>
            <p className="mt-1">{po.totalAmount ?? "—"}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-slate-500">UUID đơn</span>
            <p className="mt-1 font-mono text-xs break-all">{po.id}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Dòng đơn</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Dòng</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Đặt</TableHead>
                <TableHead className="text-right">Đã nhận</TableHead>
                <TableHead className="text-right w-36">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsLoading && lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                    Chưa có dòng hàng.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((row: PoItem) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.lineNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{row.productSku}</TableCell>
                    <TableCell className="text-right">{row.orderedQty}</TableCell>
                    <TableCell className="text-right">{row.receivedQty ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openReceive(row)}>
                        <PackageCheck className="mr-1 h-3.5 w-3.5" />
                        Nhận hàng
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitReceive}>
            <DialogHeader>
              <DialogTitle>Nhận hàng theo dòng</DialogTitle>
              {activeItem && (
                <p className="text-xs text-slate-500">
                  Dòng {activeItem.lineNumber} — SKU {activeItem.productSku}
                </p>
              )}
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">Số lượng nhận *</label>
                <Input
                  value={qtyStr}
                  onChange={(e) => setQtyStr(e.target.value)}
                  inputMode="decimal"
                  className={receiveErrors.qtyStr ? "border-rose-400" : ""}
                />
                {receiveErrors.qtyStr && <p className="text-xs text-rose-600">{receiveErrors.qtyStr}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Vị trí gợi ý (UUID, tuỳ chọn)</label>
                <Input
                  value={suggestedLocationId}
                  onChange={(e) => setSuggestedLocationId(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setReceiveOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={receiving} className="bg-indigo-600 hover:bg-indigo-700">
                {receiving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác nhận nhận"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
