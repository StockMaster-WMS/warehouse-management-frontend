import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
    label: string;
    value: string;
    options: string[];
    placeholder?: string;
    width?: string;
    onChange: (value: string) => void;
}

interface FilterGroupProps {
    filters: FilterOption[];
    onClear: () => void;
    hasAnyFilter: boolean;
}

export function FilterGroup({ filters, onClear, hasAnyFilter }: FilterGroupProps) {
    return (
        <>
            <div className="flex items-center gap-2 pr-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Filter className="h-4 w-4 text-indigo-500" />
                Bộ lọc
            </div>
            {filters.map((filter) => (
                <Select
                    key={filter.label}
                    value={filter.value}
                    onValueChange={(value) => filter.onChange(value ?? `Tất cả ${filter.label}`)}
                >
                    <SelectTrigger
                        className={`h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 ${filter.width || "sm:w-[160px]"}`}
                    >
                        <SelectValue placeholder={filter.placeholder || filter.label} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
                        <SelectItem value={`Tất cả ${filter.label}`} className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                            Tất cả {filter.label}
                        </SelectItem>
                        {filter.options.map((opt) => (
                            <SelectItem key={opt} value={opt} className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}
            {hasAnyFilter && (
                <Button
                    type="button"
                    variant="ghost"
                    className="h-10 rounded-xl px-4 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    onClick={onClear}
                >
                    <X className="mr-2 h-4 w-4" />
                    Xoá lọc
                </Button>
            )}
        </>
    );
}
