"use client";

import {
  operationDatePresetLabel,
  type OperationDatePreset,
} from "@/lib/date-range";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OperationDatePresetSelectProps = {
  value: OperationDatePreset;
  onValueChange: (value: OperationDatePreset) => void;
  className?: string;
};

export function OperationDatePresetSelect({
  value,
  onValueChange,
  className,
}: OperationDatePresetSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as OperationDatePreset)}
    >
      <SelectTrigger
        className={cn("h-10 w-full min-w-[168px] rounded-lg bg-background md:w-44", className)}
      >
        <span className="truncate text-sm">{operationDatePresetLabel(value)}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">{operationDatePresetLabel("today")}</SelectItem>
        <SelectItem value="7d">{operationDatePresetLabel("7d")}</SelectItem>
        <SelectItem value="30d">{operationDatePresetLabel("30d")}</SelectItem>
        <SelectItem value="all">{operationDatePresetLabel("all")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
