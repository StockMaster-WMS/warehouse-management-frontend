export interface Product {
  id: string;
  sku: string;
  barcodeEan13: string;
  name: string;
  categoryId: string;
  categoryName?: string | null;
  primarySupplierId: string | null;
  baseUnit: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeCm3: number;
  minStockQty: number;
  isLotTracked: boolean;
  isExpiryTracked: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface UpdateProductPayload {
  id: string;
  sku: string;
  barcodeEan13?: string;
  name: string;
  categoryId: string;
  primarySupplierId?: string | null;
  baseUnit: string;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  minStockQty?: number | null;
  isLotTracked?: boolean;
  isExpiryTracked?: boolean;
  status?: "ACTIVE" | "INACTIVE";
}

export interface CreateProductPayload {
  sku?: string;
  barcodeEan13: string;
  name: string;
  categoryId: string;
  primarySupplierId: string | null;
  baseUnit: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export function getProductCategoryDisplayName(product: Product): string {
  return product.categoryName?.trim() ?? "";
}
