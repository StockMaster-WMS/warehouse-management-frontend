"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TopSku {
  productId?: string;
  productSku: string;
  productName?: string | null;
  totalQty: number;
  totalRevenue: number;
}

export function TopSkusTable({ data }: { data?: TopSku[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground text-sm">
        Chưa có dữ liệu sản phẩm.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden dark:border-slate-800">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
          <TableRow>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider">Sản phẩm</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider">Số lượng</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider">Doanh thu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((sku) => (
            <TableRow key={sku.productId ?? sku.productSku} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <TableCell>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {sku.productName || "Chưa có tên sản phẩm"}
                </div>
                <div className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {sku.productSku}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {(sku.totalQty ?? 0).toLocaleString("vi-VN")}
              </TableCell>
              <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {(sku.totalRevenue ?? 0).toLocaleString("vi-VN")} ₫
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
