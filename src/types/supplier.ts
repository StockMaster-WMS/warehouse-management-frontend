export type SupplierStatus = "ACTIVE" | "INACTIVE";

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

export function getSupplierDisplayName(s: Supplier): string {
  const n = s.name?.trim();
  if (n) return n;
  const c = s.code?.trim();
  if (c) return c;
  return "Nhà cung cấp";
}

export function supplierStatusLabel(status: SupplierStatus | null | undefined): string {
  const u = String(status ?? "").toUpperCase();
  if (u === "ACTIVE") return "Hoạt động";
  if (u === "INACTIVE") return "Ngưng";
  return status ? String(status) : "—";
}

export function isSupplierActive(status: SupplierStatus | null | undefined): boolean {
  return String(status ?? "").toUpperCase() === "ACTIVE";
}
