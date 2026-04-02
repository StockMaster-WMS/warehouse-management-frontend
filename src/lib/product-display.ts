import type { Product } from "@/types/product";

export function getProductCategoryDisplayName(product: Product): string {
  return product.categoryName?.trim() ?? "";
}