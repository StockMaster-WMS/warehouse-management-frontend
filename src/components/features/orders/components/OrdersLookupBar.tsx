import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type OrdersLookupBarProps = {
  soNumberLookup: string;
  onSoNumberLookupChange: (value: string) => void;
  lookingUpByNumber: boolean;
  onOpenOrderBySoNumber: () => void;
};

export function OrdersLookupBar({
  soNumberLookup,
  onSoNumberLookupChange,
  lookingUpByNumber,
  onOpenOrderBySoNumber,
}: OrdersLookupBarProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:gap-3 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Tìm nhanh theo mã đơn (soNumber)</p>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          value={soNumberLookup}
          onChange={(e) => onSoNumberLookupChange(e.target.value)}
          placeholder="VD: SO-2024-001"
          className="max-w-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onOpenOrderBySoNumber();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={lookingUpByNumber} onClick={onOpenOrderBySoNumber}>
          {lookingUpByNumber ? "Đang tìm..." : "Mở đơn"}
        </Button>
      </div>
    </div>
  );
}
