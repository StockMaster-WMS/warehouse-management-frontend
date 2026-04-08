"use client";

import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

function formatLedgerDate(iso: string, pattern: "date" | "time") {
    const d = new Date(iso);
    if (pattern === "date") {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${d.getFullYear()}`;
    }
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Dummy data structure format for when the API connects later
type StockLedgerEntry = {
    id: string;
    createdAt: string;
    action: "IN" | "OUT" | "TRANSFER" | "ADJUST";
    quantity: number;
    balanceAfter: number;
    reference: string;
    user: string;
    note: string;
};

// Dữ liệu giả định trong khi chờ API BE tích hợp
const mockLedger: StockLedgerEntry[] = [
    {
        id: "txn-1",
        createdAt: new Date().toISOString(),
        action: "IN",
        quantity: 50,
        balanceAfter: 150,
        reference: "PO-2401-0012",
        user: "An Nguyen",
        note: "Nhập hàng từ NCC A",
    },
    {
        id: "txn-2",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        action: "OUT",
        quantity: -20,
        balanceAfter: 100,
        reference: "SO-2401-0099",
        user: "Binh Tran",
        note: "Xuất bán cho Đại lý K",
    },
    {
        id: "txn-3",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        action: "ADJUST",
        quantity: -2,
        balanceAfter: 120,
        reference: "ADJ-001",
        user: "An Nguyen",
        note: "Hàng cận date, xuất hủy",
    }
];

export function ProductStockLedger({ productId }: { productId: string }) {
    // TODO: Chờ gọi hook: const { data } = useGetStockLedgerQuery(productId)
    const ledger = mockLedger;

    if (!ledger || ledger.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <EmptyState
                    icon={History}
                    title="Chưa có dữ liệu lịch sử thẻ kho"
                    description="Hiện tại sản phẩm này chưa phát sinh giao dịch nhập xuất nào."
                />
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* Header / Note for mock data */}
            <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    ⚠️ Giao diện đang hiển thị dữ liệu mẫu. Tính năng này đang chờ BE tích hợp API get-stock-ledger.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium">Ngày/Giờ</th>
                            <th className="px-4 py-3 font-medium">Loại GD</th>
                            <th className="px-4 py-3 font-medium">Chứng từ</th>
                            <th className="px-4 py-3 text-right font-medium">SL (+/-)</th>
                            <th className="px-4 py-3 text-right font-medium">Tồn sau GD</th>
                            <th className="px-4 py-3 font-medium">Người thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {ledger.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900 dark:text-slate-200">
                                            {formatLedgerDate(entry.createdAt, "date")}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {formatLedgerDate(entry.createdAt, "time")}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {entry.action === "IN" && (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                                            <ArrowDownRight className="w-3 h-3 mr-1" /> Nhập kho
                                        </Badge>
                                    )}
                                    {entry.action === "OUT" && (
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50">
                                            <ArrowUpRight className="w-3 h-3 mr-1" /> Xuất kho
                                        </Badge>
                                    )}
                                    {entry.action === "ADJUST" && (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50">
                                            Kiểm kê / Điều chỉnh
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs font-bold">{entry.reference}</span>
                                        <span className="text-xs text-slate-500 truncate max-w-[150px]">{entry.note}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`font-bold ${entry.quantity > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                    {entry.balanceAfter}
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                                    {entry.user}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
