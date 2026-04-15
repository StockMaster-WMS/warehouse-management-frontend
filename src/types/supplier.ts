// ============================================================
// Supplier – chỉ chứa types & interfaces
// Utility functions đã được chuyển sang:
//   src/components/features/suppliers/utils.ts
// ============================================================

export type SupplierStatus = "active" | "inactive" | "suspended";

/** Một bản ghi nhà cung cấp (khớp JSON backend). */
export interface Supplier {
  id: string;
  code: string;
  name: string;
  taxCode?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  paymentTerms?: number | null;
  leadTimeDays?: number | null;
  status: SupplierStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateSupplierRequest {
  code?: string;
  name: string;
  taxCode?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  paymentTerms?: number;
  leadTimeDays?: number;
  status?: string;
}

export type UpdateSupplierRequest = CreateSupplierRequest;

// ---- Re-exports của utility functions (backward compatibility) ----
// Các file đang import helpers từ "@/types/supplier" vẫn hoạt động
export {
  getSupplierDisplayName,
  supplierStatusLabel,
  supplierStatusClass,
  isSupplierActive,
  SUPPLIER_STATUS_LABEL,
} from "@/components/features/suppliers/utils";
