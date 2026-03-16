import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  allLabel,
  widthClass,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  allLabel: string;
  widthClass?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? allLabel)}>
      <SelectTrigger className={`h-10 w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 ${widthClass || "sm:w-auto"}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border border-slate-200 shadow-xl dark:border-slate-800">
        <SelectItem value={allLabel} className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
          {allLabel}
        </SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
