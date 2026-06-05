export interface Product {
  id: string;
  sku: string;
  barcodeEan13: string | null;
  name: string;
  categoryId: string;
  categoryName?: string | null;
  primarySupplierId: string | null;
  primarySupplierName?: string | null;
  baseUnit: string;
  weightKg: number | null;
  volumeCm3: number | null;
  minStockQty: number;
  qtyOnHand?: number | null;
  qtyAvailable?: number | null;
  currentStock?: number | null;
  availableStock?: number | null;
  isLotTracked: boolean;
  isExpiryTracked: boolean;
  isFrozen: boolean;
  isFragile: boolean;
  isHazmat: boolean;
  isHeavy: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string | null;
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
  volumeCm3?: number | null;
  minStockQty?: number | null;
  isLotTracked?: boolean;
  isExpiryTracked?: boolean;
  isFrozen?: boolean;
  isFragile?: boolean;
  isHazmat?: boolean;
  isHeavy?: boolean;
  status?: "ACTIVE" | "INACTIVE";
}

export interface CreateProductPayload {
  sku?: string;
  barcodeEan13?: string;
  name: string;
  categoryId: string;
  primarySupplierId?: string | null;
  baseUnit: string;
  weightKg?: number | null;
  volumeCm3?: number | null;
  minStockQty?: number;
  isLotTracked?: boolean;
  isExpiryTracked?: boolean;
  isFrozen?: boolean;
  isFragile?: boolean;
  isHazmat?: boolean;
  isHeavy?: boolean;
  createdBy?: string;
}

export interface ProductImportRowError {
  rowNumber: number;
  message: string;
}

export interface ProductImportResponse {
  attempted: number;
  success: number;
  failureCount: number;
  errors: ProductImportRowError[];
}

export function normalizeProductImportResponse(raw: unknown): ProductImportResponse {
  const r = raw as Record<string, unknown>;
  const errList = Array.isArray(r.errors) ? r.errors : [];
  return {
    attempted: Number(r.attempted ?? 0),
    success: Number(r.success ?? 0),
    failureCount: Number(r.failureCount ?? r.failure_count ?? 0),
    errors: errList.map((e) => {
      const x = e as Record<string, unknown>;
      return {
        rowNumber: Number(x.rowNumber ?? x.row_number ?? 0),
        message: String(x.message ?? ""),
      };
    }),
  };
}
