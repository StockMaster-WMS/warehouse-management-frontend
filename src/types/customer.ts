export type CustomerAddress = Record<string, unknown>;

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  taxCode?: string | null;
  address?: CustomerAddress | null;
  notes?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateCustomerRequest {
  code: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  taxCode?: string;
  address?: CustomerAddress;
  notes?: string;
  isActive?: boolean;
}

export type UpdateCustomerRequest = CreateCustomerRequest;

export function customerStatusLabel(isActive: boolean | null | undefined): string {
  if (isActive === false) return "Ngừng hoạt động";
  return "Đang hoạt động";
}

export function customerStatusClass(isActive: boolean | null | undefined): string {
  if (isActive === false) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
}

export function formatCustomerAddress(address: CustomerAddress | string | null | undefined): string {
  if (!address) return "—";
  if (typeof address === "string") return address.trim() || "—";

  const orderedKeys = ["line1", "street", "ward", "district", "city", "province", "country"];
  const orderedParts = orderedKeys
    .map((key) => address[key])
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (orderedParts.length > 0) {
    return orderedParts.join(", ");
  }

  const fallbackParts = Object.values(address)
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map((value) => String(value).trim())
    .filter(Boolean);

  return fallbackParts.length > 0 ? fallbackParts.join(", ") : "—";
}
