import { z } from "zod";
import type { SoItem } from "@/types/so-item";
import type { PickingItem } from "@/types/picking-item";
import type { StockExpanded } from "@/types/stock";

export const soLineSchema = z.object({
  productId: z.string().min(1, "Chọn sản phẩm"),
  orderedQtyStr: z.string().min(1, "Nhập số lượng"),
  unitPriceStr: z.string().optional(),
});

export const pickingCreateSchema = z.object({
  locationId: z.string().min(1, "Nhập locationId"),
  qtyToPickStr: z.string().min(1, "Nhập qtyToPick"),
  status: z.enum(["PENDING", "PICKED"]),
  qtyPickedStr: z.string().optional(),
});

export function parsePositiveNumber(raw: string): number | null {
  const n = Number(String(raw ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || !(n > 0)) return null;
  return n;
}

export function parseNonNegativeNumber(raw: string): number | null {
  const n = Number(String(raw ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function stockRowLocationLabel(r: StockExpanded): string {
  const code = r.location?.code?.trim() || r.location?.name?.trim();
  return code || r.locationId;
}

export function computePickedSummary(soItem: SoItem, picks: PickingItem[]) {
  const totalToPick = picks.reduce((s, p) => s + (p.qtyToPick ?? 0), 0);
  const totalPicked = picks.reduce((s, p) => s + (p.qtyPicked ?? 0), 0);
  const allPicked = picks.length > 0 && picks.every((p) => p.status === "PICKED" && (p.qtyPicked ?? 0) === p.qtyToPick);
  const enoughForLine = totalPicked >= soItem.orderedQty;
  const qtyLineMismatch =
    picks.length > 0 && Number(soItem.orderedQty) !== Number(totalToPick);
  return { totalToPick, totalPicked, allPicked, enoughForLine, qtyLineMismatch };
}

export function formatLotLine(lot: string | null | undefined): string {
  const s = lot == null ? "" : String(lot).trim();
  if (s === "") return "Không lô";
  return s;
}
