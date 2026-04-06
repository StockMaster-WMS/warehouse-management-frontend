export type SupplierStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

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
  code: string;
  name: string;
  taxCode?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  paymentTerms?: number;
  leadTimeDays?: number;
  status?: SupplierStatus;
}

export type UpdateSupplierRequest = CreateSupplierRequest;

export function getSupplierDisplayName(s: Supplier): string {
  const n = s.name?.trim();
  if (n) return n;
  const c = s.code?.trim();
  if (c) return c;
  return "Nhà cung cấp";
}

export const SUPPLIER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngưng hoạt động",
  SUSPENDED: "Tạm ngưng",
};

export function supplierStatusLabel(
  status: SupplierStatus | string | null | undefined,
): string {
  const key = (status ?? "").toUpperCase();
  return SUPPLIER_STATUS_LABEL[key] ?? status ?? "—";
}

export function supplierStatusClass(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
    case "INACTIVE":
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    case "SUSPENDED":
      return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

export function isSupplierActive(
  status: SupplierStatus | null | undefined,
): boolean {
  return String(status ?? "").toUpperCase() === "ACTIVE";
}
