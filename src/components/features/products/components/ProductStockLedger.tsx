"use client";

import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStockMovementsQuery } from "@/store/services/stock.service";
import { apiErrMessage } from "@/types/api";

function formatLedgerDate(iso: string, pattern: "date" | "time") {
    const d = new Date(iso);
    if (pattern === "date") {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${d.getFullYear()}`;
    }
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ProductStockLedger({ productId }: { productId: string }) {
    const { data, isLoading, error } = useGetStockMovementsQuery({
        productId,
        size: 50, // Get last 50 transactions
        sort: "createdAt",
        sortDir: "desc"
    });

    const movements = data?.data?.content || [];

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center">
                <p className="text-sm font-semibold text-rose-700">Không thể tải thẻ kho</p>
                <p className="text-xs text-rose-600">{apiErrMessage(error)}</p>
            </div>
        );
    }

    if (movements.length === 0) {
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
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium">Ngày/Giờ</th>
                            <th className="px-4 py-3 font-medium">Loại GD</th>
                            <th className="px-4 py-3 font-medium">Vị trí</th>
                            <th className="px-4 py-3 text-right font-medium">SL (+/-)</th>
                            <th className="px-4 py-3 text-right font-medium">Tồn sau GD</th>
                            <th className="px-4 py-3 font-medium">Mã tham chiếu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {movements.map((entry) => {
                            const isPositive = entry.qtyChange > 0;
                            return (
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
                                        {entry.movementType === "INBOUND" ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                <ArrowDownRight className="w-3 h-3 mr-1" /> Nhập
                                            </Badge>
                                        ) : entry.movementType === "OUTBOUND" ? (
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                <ArrowUpRight className="w-3 h-3 mr-1" /> Xuất
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">{entry.movementType}</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {entry.locationCode || "—"}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{entry.warehouseCode}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                            {isPositive ? `+${entry.qtyChange}` : entry.qtyChange}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                        {entry.qtyAfter}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                {entry.referenceId || "N/A"}
                                            </span>
                                            {entry.reason && (
                                                <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
                                                    {entry.reason}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
