"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Loader2, PackagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";
import type { SoItem } from "@/types/so-item";
import type { PickingItem, PickingItemStatus } from "@/types/picking-item";
import {
  useGetPickingItemsQuery,
  useCreatePickingItemMutation,
  useUpdatePickingItemMutation,
  useDeletePickingItemMutation,
} from "@/store/services/picking-item.service";
import {
  computePickedSummary,
  formatLotLine,
  parseNonNegativeNumber,
  parsePositiveNumber,
  pickingCreateSchema,
} from "./order-detail-utils";

export function SoItemPickingBlock({
  soItem,
  salesOrderStatus,
  productsById,
}: {
  soItem: SoItem;
  salesOrderStatus: string;
  productsById: Map<string, Product>;
}) {
  const { data: picksRes, isFetching } = useGetPickingItemsQuery({
    soItemId: soItem.id,
    page: 0,
    size: 50,
  });
  const picks = useMemo(() => picksRes?.data?.content ?? [], [picksRes]);

  const [createPicking, { isLoading: creatingPick }] = useCreatePickingItemMutation();
  const [updatePicking, { isLoading: updatingPick }] = useUpdatePickingItemMutation();
  const [deletePicking, { isLoading: deletingPick }] = useDeletePickingItemMutation();

  const [locationId, setLocationId] = useState("");
  const [qtyToPickStr, setQtyToPickStr] = useState("");
  const [pickStatus, setPickStatus] = useState<PickingItemStatus>("PENDING");
  const [qtyPickedStr, setQtyPickedStr] = useState("");
  const [pickErrors, setPickErrors] = useState<Record<string, string>>({});
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [manualPickFormOpen, setManualPickFormOpen] = useState(true);

  const recentKey = useMemo(() => `recentLocations:soItem:${soItem.id}`, [soItem.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(recentKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        setRecentLocations(parsed.slice(0, 8));
      }
    } catch {
      // ignore
    }
  }, [recentKey]);

  useEffect(() => {
    setManualPickFormOpen(picks.length === 0);
  }, [picks.length]);

  function rememberLocation(loc: string) {
    const v = String(loc || "").trim().toUpperCase();
    if (!v) return;
    setRecentLocations((prev) => {
      const next = [v, ...prev.filter((x) => x !== v)].slice(0, 8);
      try {
        localStorage.setItem(recentKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const allowPickingMutation = salesOrderStatus === "PENDING" || salesOrderStatus === "PICKING";
  const summary = useMemo(() => computePickedSummary(soItem, picks), [soItem, picks]);
  const product = productsById.get(soItem.productId);

  useEffect(() => {
    if (pickStatus === "PICKED") {
      const q = qtyToPickStr.trim();
      if (q) setQtyPickedStr(q);
    } else if (pickStatus === "PENDING") {
      setQtyPickedStr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickStatus]);

  async function onCreatePick(e: React.FormEvent) {
    e.preventDefault();
    if (!allowPickingMutation) {
      toast.error("Không thể tạo picking khi đơn đã PACKED/SHIPPED.");
      return;
    }
    setPickErrors({});
    const parsed = pickingCreateSchema.safeParse({
      locationId,
      qtyToPickStr,
      status: pickStatus,
      qtyPickedStr: qtyPickedStr || undefined,
    });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) err[String(issue.path[0] ?? "form")] = issue.message;
      setPickErrors(err);
      toast.error("Kiểm tra picking item");
      return;
    }

    const qtyToPick = parsePositiveNumber(parsed.data.qtyToPickStr);
    if (qtyToPick == null) {
      setPickErrors({ qtyToPickStr: "qtyToPick phải > 0" });
      toast.error("qtyToPick không hợp lệ");
      return;
    }

    const qtyPicked =
      parsed.data.qtyPickedStr?.trim() ? parseNonNegativeNumber(parsed.data.qtyPickedStr) : 0;
    if (qtyPicked == null) {
      setPickErrors({ qtyPickedStr: "qtyPicked phải >= 0" });
      toast.error("qtyPicked không hợp lệ");
      return;
    }
    if (qtyPicked > qtyToPick) {
      setPickErrors({ qtyPickedStr: "qtyPicked không được vượt qtyToPick" });
      toast.error("qtyPicked không hợp lệ");
      return;
    }
    if (parsed.data.status === "PICKED" && qtyPicked !== qtyToPick) {
      setPickErrors({ qtyPickedStr: "Nếu PICKED thì qtyPicked phải = qtyToPick" });
      toast.error("Nếu PICKED thì qtyPicked phải = qtyToPick");
      return;
    }

    try {
      const res = await createPicking({
        soItemId: soItem.id,
        productId: soItem.productId,
        locationId: parsed.data.locationId.trim().toUpperCase(),
        qtyToPick,
        status: parsed.data.status,
        qtyPicked,
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Tạo picking thất bại");
        return;
      }
      toast.success(res.message || "Đã tạo picking");
      rememberLocation(parsed.data.locationId);
      setLocationId("");
      setQtyToPickStr("");
      setPickStatus("PENDING");
      setQtyPickedStr("");
    } catch (err) {
      toast.error(apiErrMessage(err));
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
            {isFetching ? <span className="ml-2 text-[11px] text-muted-foreground">Đang cập nhật…</span> : null}
          </p>
          {summary.qtyLineMismatch ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tổng lệnh lấy ({summary.totalToPick}) ≠ số đặt ({soItem.orderedQty}) — hoàn thành từng dòng bên dưới.
            </p>
          ) : null}
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
          {picks.length > 0 ? (
            <p className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-[11px] text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100">
              <span className="font-semibold">Đã có lệnh lấy.</span> Sau khi lấy đúng SL tại kho, bấm{" "}
              <span className="font-semibold">Xác nhận đủ SL</span> từng dòng. Chỉ mở form dưới khi cần thêm vị trí/lô.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Chưa có picking — dùng form bên dưới hoặc tự phân bổ khi thêm dòng đơn.</p>
          )}

          {picks.length > 0 ? (
            <div className="space-y-2">
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
                        <span className="font-mono text-sm font-bold text-foreground">{p.locationId}</span>
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

          <details
            className="group rounded-lg border border-border bg-muted/30"
            open={manualPickFormOpen}
            onToggle={(e) => setManualPickFormOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <PackagePlus className="h-4 w-4 text-primary" />
                Thêm picking thủ công
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
              </span>
            </summary>

            <form onSubmit={onCreatePick} className="border-t border-border bg-background p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Mã vị trí *</label>
                  {recentLocations.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {recentLocations.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocationId(loc)}
                          className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-mono text-muted-foreground hover:bg-muted"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <Input
                    value={locationId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLocationId(v.toUpperCase());
                      setPickErrors((prev) => ({ ...prev, locationId: "" }));
                    }}
                    onBlur={() => setLocationId((v) => v.trim().toUpperCase())}
                    placeholder="LOC-001"
                  />
                  {pickErrors.locationId ? <p className="text-xs text-rose-600">{pickErrors.locationId}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">SL cần lấy *</label>
                  <Input
                    value={qtyToPickStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setQtyToPickStr(v);
                      setPickErrors((prev) => ({ ...prev, qtyToPickStr: "" }));
                      if (pickStatus === "PICKED") setQtyPickedStr(v);
                    }}
                    placeholder="10"
                    inputMode="decimal"
                  />
                  {pickErrors.qtyToPickStr ? <p className="text-xs text-rose-600">{pickErrors.qtyToPickStr}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Trạng thái *</label>
                  <Select value={pickStatus} onValueChange={(v) => setPickStatus(v as PickingItemStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Chờ lấy</SelectItem>
                      <SelectItem value="PICKED">Đã lấy đủ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">SL đã lấy</label>
                  <Input
                    value={qtyPickedStr}
                    onChange={(e) => {
                      setQtyPickedStr(e.target.value);
                      setPickErrors((prev) => ({ ...prev, qtyPickedStr: "" }));
                    }}
                    placeholder={pickStatus === "PICKED" ? qtyToPickStr || "0" : "0"}
                    inputMode="decimal"
                  />
                  {pickErrors.qtyPickedStr ? <p className="text-xs text-rose-600">{pickErrors.qtyPickedStr}</p> : null}
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Button type="submit" size="sm" disabled={!allowPickingMutation || creatingPick}>
                  {creatingPick ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Thêm dòng picking
                </Button>
              </div>
            </form>
          </details>
        </div>
      </div>
    </details>
  );
}
