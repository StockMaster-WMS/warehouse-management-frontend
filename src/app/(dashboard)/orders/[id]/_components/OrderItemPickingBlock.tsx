"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";
import type { SoItem } from "@/types/so-item";
import type { PickingItem } from "@/types/picking-item";
import type { StockExpanded } from "@/types/stock";
import { useGetStocksQuery } from "@/store/services/stock.service";
import {
    computePickedSummary,
    formatLotLine,
    formatPickingLocationLabel,
    stockRowLocationLabel,
} from "./OrderDetailUtils";
import {
    useCreatePickingItemMutation,
    useDeletePickingItemMutation,
    useGetPickingItemsQuery,
    useUpdatePickingItemMutation,
} from "@/store/services/picking-item.service";

type OrderItemPickingBlockProps = {
    soItem: SoItem;
    salesOrderStatus: string;
    warehouseId: string;
    productsById: Map<string, Product>;
};

export function OrderItemPickingBlock({
    soItem,
    salesOrderStatus,
    warehouseId,
    productsById,
}: OrderItemPickingBlockProps) {
    const { data: picksRes, isFetching: picksLoading } = useGetPickingItemsQuery({
        soItemId: soItem.id,
        page: 0,
        size: 50,
    });
    const picks = useMemo(() => picksRes?.data?.content ?? [], [picksRes]);

    const [createPicking, { isLoading: creatingPick }] = useCreatePickingItemMutation();
    const [updatePicking, { isLoading: updatingPick }] = useUpdatePickingItemMutation();
    const [deletePicking, { isLoading: deletingPick }] = useDeletePickingItemMutation();
    const [creatingFromStockId, setCreatingFromStockId] = useState<string | null>(null);

    const allowPickingMutation = salesOrderStatus === "PENDING" || salesOrderStatus === "PICKING";
    const summary = useMemo(() => computePickedSummary(soItem, picks), [soItem, picks]);
    const product = productsById.get(soItem.productId);
    const remainingQty = Math.max(0, Number(soItem.orderedQty ?? 0) - summary.totalToPick);

    const { data: stockRes, isFetching: stocksLoading, isError: stocksError, error: stocksErr } = useGetStocksQuery(
        {
            productId: soItem.productId,
            warehouseId,
            expand: "location,warehouse,product",
            page: 0,
            size: 100,
            sort: "updatedAt",
            sortDir: "desc",
        },
        { skip: !warehouseId || !allowPickingMutation }
    );

    const stockRows = useMemo(() => {
        const rows = stockRes?.data?.content ?? [];
        return [...rows]
            .filter((row) => Number(row.qtyAvailable ?? 0) > 0)
            .sort((a, b) => Number(b.qtyAvailable ?? 0) - Number(a.qtyAvailable ?? 0));
    }, [stockRes]);
    const hasRemainingQty = remainingQty > 0;

    function getRowLabel(row: StockExpanded) {
        return stockRowLocationLabel(row);
    }

    async function onCreatePickFromStock(row: StockExpanded) {
        if (!allowPickingMutation) {
            toast.error("Không thể tạo picking khi đơn đã PACKED/SHIPPED.");
            return;
        }

        const available = Number(row.qtyAvailable ?? 0);
        const qtyToPick = Math.min(available, remainingQty);
        if (qtyToPick <= 0) {
            toast.error("Không còn số lượng cần tạo picking.");
            return;
        }

        setCreatingFromStockId(row.id);
        try {
            const res = await createPicking({
                soItemId: soItem.id,
                productId: soItem.productId,
                locationId: row.locationId,
                lotNumber: row.lotNumber ?? undefined,
                qtyToPick,
                qtyPicked: 0,
                status: "PENDING",
            }).unwrap();

            if (!res.success) {
                toast.error(res.message || "Tạo picking thất bại");
                return;
            }

            toast.success(`Đã tạo picking từ ${getRowLabel(row)}`);
        } catch (err) {
            toast.error(apiErrMessage(err));
        } finally {
            setCreatingFromStockId(null);
        }
    }

    async function onQuickMarkPicked(p: PickingItem) {
        if (!allowPickingMutation) {
            toast.error("Không thể cập nhật picking khi đơn đã PACKED/SHIPPED.");
            return;
        }
        const qtyToPick = Number(p.qtyToPick);
        if (!Number.isFinite(qtyToPick) || qtyToPick <= 0) {
            toast.error("Dòng picking thiếu số lượng cần lấy (qtyToPick). Tải lại trang.");
            return;
        }
        try {
            const res = await updatePicking({
                id: p.id,
                soItemId: p.soItemId,
                productId: p.productId,
                locationId: p.locationId,
                qtyToPick,
                qtyPicked: qtyToPick,
                status: "PICKED",
                pickSequence: p.pickSequence ?? undefined,
                lotNumber: p.lotNumber ?? undefined,
            }).unwrap();
            if (!res.success) toast.error(res.message || "Cập nhật thất bại");
            else toast.success("Đã cập nhật PICKED");
        } catch (err) {
            toast.error(apiErrMessage(err));
        }
    }

    async function onDeletePicking(p: PickingItem) {
        if (!allowPickingMutation) {
            toast.error("Không thể xóa picking khi đơn đã PACKED/SHIPPED.");
            return;
        }
        const ok = window.confirm("Xóa dòng picking này? Hệ thống sẽ nhả giữ chỗ tồn.");
        if (!ok) return;
        try {
            const res = await deletePicking({ id: p.id, soItemId: soItem.id }).unwrap();
            if (!res.success) toast.error(typeof res.message === "string" ? res.message : "Xóa thất bại");
            else toast.success("Đã xóa dòng picking");
        } catch (err) {
            toast.error(apiErrMessage(err));
        }
    }

    return (
        <details className="group rounded-lg border border-border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                        Line #{soItem.lineNumber} · {product?.name ?? "Sản phẩm"}{" "}
                        <span className="text-xs font-mono text-muted-foreground">({soItem.productSku})</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Đặt <span className="font-semibold tabular-nums">{soItem.orderedQty}</span>
                        {" · "}
                        Đã lấy{" "}
                        <span className={`font-semibold tabular-nums ${summary.enoughForLine ? "text-emerald-600" : "text-amber-600"}`}>
                            {summary.totalPicked}
                        </span>
                        {" / "}
                        <span className="tabular-nums font-semibold">{summary.totalToPick}</span>
                        {picksLoading ? <span className="ml-2 text-[11px] text-muted-foreground">Đang cập nhật…</span> : null}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className={
                            summary.allPicked
                                ? "rounded-md border-emerald-500/20 bg-emerald-500/10 font-bold text-emerald-800 dark:text-emerald-200"
                                : "rounded-md font-bold"
                        }
                    >
                        {summary.allPicked ? "Đã lấy đủ" : "Chưa xong"}
                    </Badge>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
                </div>
            </summary>

            <div className="border-t border-border p-4">
                <div className="space-y-3">
                    {picks.length > 0 ? null : (
                        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            Chưa có picking cho line này. Chọn vị trí bên dưới để tạo picking.
                        </div>
                    )}
                    {picks.length > 0 ? (
                        <div className="space-y-3">
                            {picks.map((p) => {
                                const picked = Number(p.qtyPicked ?? 0);
                                const need = Number(p.qtyToPick ?? 0);
                                const pct = need > 0 ? Math.min(100, Math.round((picked / need) * 100)) : 0;

                                return (
                                    <div
                                        key={p.id}
                                        className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                <span className="font-mono text-sm font-bold text-foreground">
                                                    {formatPickingLocationLabel(p.locationCode, p.locationName, p.locationId)}
                                                </span>
                                                <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
                                                    Lô {formatLotLine(p.lotNumber)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                                        p.status === "PICKED"
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                                                            : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
                                                    )}
                                                >
                                                    {p.status === "PICKED" ? "Đã lấy" : "Đang lấy"}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-[width]",
                                                            p.status === "PICKED" ? "bg-emerald-500" : "bg-amber-500",
                                                        )}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="shrink-0 tabular-nums text-[11px] font-semibold text-muted-foreground">
                                                    {picked}/{need}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="text-rose-600"
                                                disabled={!allowPickingMutation || deletingPick || updatingPick}
                                                onClick={() => onDeletePicking(p)}
                                            >
                                                {deletingPick ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                                Xóa lệnh
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={!allowPickingMutation || updatingPick || p.status === "PICKED"}
                                                onClick={() => onQuickMarkPicked(p)}
                                            >
                                                {updatingPick ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Xác nhận đủ SL
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </details>
    );
}
