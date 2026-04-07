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
  code: string;
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

export function getSupplierDisplayName(s: Supplier): string {
  const n = s.name?.trim();
  if (n) return n;
  const c = s.code?.trim();
  if (c) return c;
  return "Nhà cung cấp";
}

export const SUPPLIER_STATUS_LABEL: Record<string, string> = {
  active: "Đang hoạt động",
  inactive: "Ngừng hoạt động",
  suspended: "Tạm ngưng",
};

export function supplierStatusLabel(status: string | null | undefined): string {
  const key = (status ?? "").toLowerCase();
  return SUPPLIER_STATUS_LABEL[key] ?? status ?? "—";
}

export function supplierStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
    case "inactive":
      return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400";
    case "suspended":
      return "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

export function isSupplierActive(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "active";
}
