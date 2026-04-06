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
  lotNumber: z.string().optional(),
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
  return { totalToPick, totalPicked, allPicked, enoughForLine };
}

export function formatLotLine(lot: string | null | undefined): string {
  const s = lot == null ? "" : String(lot).trim();
  if (s === "") return "Không lô";
  return s;
}

export function formatPickingLocationLabel(
  locationCode?: string | null,
  locationName?: string | null,
  locationId?: string | null,
): string {
  const code = String(locationCode ?? "").trim();
  if (code) return code;

  const name = String(locationName ?? "").trim();
  if (name) return name;

  const id = String(locationId ?? "").trim();
  if (!id) return "Vị trí";

  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (uuidLike) return "Vị trí";

  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}
