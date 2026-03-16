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
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Filter className="h-4 w-4 text-slate-400" />
                Bộ lọc
            </div>
            {filters.map((filter, idx) => (
                <Select
                    key={filter.label}
                    value={filter.value}
                    onValueChange={(value) => filter.onChange(value ?? "all")}
                >
                    <SelectTrigger
                        className={`h-9 w-full border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30 ${filter.width || "sm:w-56"}`}
                    >
                        <SelectValue placeholder={filter.placeholder || filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả {filter.label}</SelectItem>
                        {filter.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}
            <Button
                type="button"
                variant="outline"
                className="h-9 border-slate-200"
                onClick={onClear}
                disabled={!hasAnyFilter}
            >
                <X className="mr-2 h-4 w-4" />
                Xoá lọc
            </Button>
        </>
    );
}
