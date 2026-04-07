import { type PagedResponse } from "@/types/api";
import type { Supplier } from "@/types/supplier";

export function buildSuppliersPageMeta(
  pagedBody: PagedResponse<Supplier> | undefined,
  rowsLength: number,
) {
  if (!pagedBody || typeof pagedBody.page !== "number" || typeof pagedBody.total_pages !== "number") {
    return null;
  }

  return {
    page: pagedBody.page,
    size: pagedBody.size,
    total_elements: pagedBody.total_elements,
    total_pages: pagedBody.total_pages,
    rowsLength,
  };
}
