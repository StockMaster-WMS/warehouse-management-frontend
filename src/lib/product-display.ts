import type { Product } from "@/types/product";

const PRODUCT_UNIT_LABELS: Record<string, string> = {
  BAG: "Bao",
  BOTTLE: "Chai",
  BOX: "Thùng/Hộp",
  CAN: "Lon",
  CARTON: "Thùng carton",
  CASE: "Kiện",
  DOZEN: "Tá",
  G: "Gram",
  KG: "Kg",
  L: "Lít",
  M: "Mét",
  ML: "Ml",
  PACK: "Gói",
  PAIR: "Đôi",
  PCS: "Cái",
  PIECE: "Cái",
  ROLL: "Cuộn",
  SET: "Bộ",
  UNIT: "Cái",
};

export function getProductCategoryDisplayName(product: Product): string {
  return product.categoryName?.trim() ?? "";
}

export function formatProductBaseUnit(unit: string | null | undefined): string {
  const value = unit?.trim();
  if (!value) return "—";
  return PRODUCT_UNIT_LABELS[value.toUpperCase()] ?? value;
}
