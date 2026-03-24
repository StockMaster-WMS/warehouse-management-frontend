export type CustomerCategory = "INDIVIDUAL" | "WHOLESALE";

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  category?: CustomerCategory | null;
  address?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function customerCategoryLabel(cat: CustomerCategory | null | undefined): string {
  switch (cat) {
    case "INDIVIDUAL": return "Cá nhân";
    case "WHOLESALE": return "Nhà buôn";
    default: return cat ?? "—";
  }
}
