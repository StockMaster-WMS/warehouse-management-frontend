import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Product } from "@/types/product";
import { StockExpanded } from "@/types/stock";
import type { Location } from "@/types/location";

type ProductHeroSectionProps = {
    product: Product;
    onCopySku: () => void;
    onPrintBarcode?: () => void;
};

export function ProductHeroSection({ product, onCopySku, onPrintBarcode }: ProductHeroSectionProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sản phẩm</p>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{product.name}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mã SKU: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{product.sku}</span>
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" className="w-fit border-slate-300" onClick={onCopySku}>
                        Sao chép SKU
                    </Button>
                    {onPrintBarcode && (
                        <Button variant="outline" size="sm" className="w-fit border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300" onClick={onPrintBarcode}>
                            <Printer className="mr-2 h-4 w-4" />
                            In mã vạch
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}

type ProductInfoFieldProps = {
    label: string;
    value: string;
    mono?: boolean;
    compact?: boolean;
    className?: string;
};

export function ProductInfoField({ label, value, mono = false, compact = false, className }: ProductInfoFieldProps) {
    return (
        <div
            className={`rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/30 ${className ?? ""}`}
        >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p
                className={`mt-1 text-slate-900 dark:text-slate-100 ${compact ? "text-sm font-semibold" : "text-sm"
                    } ${mono ? "font-mono" : ""}`}
            >
                {value}
            </p>
        </div>
    );
}

type ProductStockByLocationListProps = {
    stocks: StockExpanded[];
    locationMap: Record<string, Location>;
    isLoading: boolean;
    errorMessage: string | null;
};

export function ProductStockByLocationList({
    stocks,
    locationMap,
    isLoading,
    errorMessage,
}: ProductStockByLocationListProps) {
    if (isLoading) {
        return <p className="text-sm text-slate-500">Đang tải dữ liệu tồn kho theo vị trí...</p>;
    }

    if (errorMessage) {
        return <p className="text-sm text-rose-600 dark:text-rose-400">{errorMessage}</p>;
    }

    if (stocks.length === 0) {
        return <p className="text-sm text-slate-500">Chưa có dữ liệu tồn kho cho sản phẩm này.</p>;
    }

    return (
        <ul className="space-y-2">
            {stocks.map((stock) => {
                const locationCode = locationMap[stock.locationId]?.code;
                const locationName =
                    locationCode || stock.location?.name || `Vị trí ${stock.locationId}`;

                return (
                    <li
                        key={stock.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/30"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{locationName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{stock.qtyOnHand}</p>
                            <p className="text-xs text-slate-500">khả dụng: {stock.qtyAvailable}</p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
