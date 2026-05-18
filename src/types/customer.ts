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

  // Group synonym keys — only pick the first non-empty value per group
  const keyGroups = [
    ["line1", "street"],
    ["wardName", "ward"],
    ["districtName", "district"],
    ["provinceName", "city", "province"],
  ];

  const parts: string[] = [];
  for (const group of keyGroups) {
    for (const key of group) {
      const val = address[key];
      if (typeof val === "string" && val.trim()) {
        parts.push(val.trim());
        break;
      }
    }
  }

  if (parts.length > 0) return parts.join(", ");

  // Fallback: deduplicate all string values
  const seen = new Set<string>();
  for (const val of Object.values(address)) {
    if (typeof val === "string" && val.trim()) seen.add(val.trim());
  }
  return seen.size > 0 ? [...seen].join(", ") : "—";
}
