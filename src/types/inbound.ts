export type InboundLine = {
  rowId: string;
  productId: string;
  sku: string;
  name: string;
  qtyStr: string;
  unitPriceStr: string;
};

export type FieldErrors = {
  supplier?: string;
  warehouse?: string;
  date?: string;
  lines?: string;
};

export type LineFormErrors = {
  product?: string;
  qty?: string;
};
