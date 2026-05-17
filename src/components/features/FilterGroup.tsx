import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";

export interface FilterOption {
    label: string;
    value: string;
    options: Array<string | { label: string; value: string }>;
    placeholder?: string;
    width?: string;
    onChange: (value: string) => void;
}

interface FilterGroupProps {
    filters: FilterOption[];
    onClear: () => void;
    hasAnyFilter: boolean;
    title?: string;
    showTitle?: boolean;
    showClear?: boolean;
}

export function FilterGroup({
    filters,
    onClear,
    hasAnyFilter,
    title = "Bộ lọc",
    showTitle = true,
    showClear = true,
}: FilterGroupProps) {
    const optionLabel = (filter: FilterOption) => {
        const explicit = filter.options.find((opt) =>
            typeof opt === "string" ? opt === filter.value : opt.value === filter.value,
        );
        if (explicit) return typeof explicit === "string" ? explicit : explicit.label;
        return filter.value || filter.placeholder || filter.label;
    };

    return (
        <>
            {showTitle ? (
                <div className="flex items-center gap-2 pr-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Filter className="h-4 w-4 text-indigo-500" />
                    {title}
                </div>
            ) : null}
            {filters.map((filter) => (
                <Select
                    key={filter.label}
                    value={filter.value}
                    onValueChange={(value) => filter.onChange(value ?? `Tất cả ${filter.label}`)}
                >
                    <SelectTrigger
                        className={`h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 ${filter.width || "sm:w-[160px]"}`}
                    >
                        <span className="truncate text-sm">{optionLabel(filter)}</span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
                        <SelectItem value={`Tất cả ${filter.label}`} className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                            Tất cả {filter.label}
                        </SelectItem>
                        {filter.options.map((opt) => {
                            const value = typeof opt === "string" ? opt : opt.value;
                            const label = typeof opt === "string" ? opt : opt.label;
                            return (
                            <SelectItem key={value} value={value} className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                                {label}
                            </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            ))}
            {showClear && hasAnyFilter && (
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
