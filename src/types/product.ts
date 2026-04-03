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
