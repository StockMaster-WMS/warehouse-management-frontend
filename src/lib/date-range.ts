export type OperationDatePreset = "today" | "7d" | "30d" | "all";

export type IsoDateRange = {
  createdFrom?: string;
  createdTo?: string;
};

export const DEFAULT_OPERATION_DATE_PRESET: OperationDatePreset = "today";

function startOfLocalDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfLocalDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function getOperationDateRange(preset: OperationDatePreset): IsoDateRange {
  if (preset === "all") return {};

  const now = new Date();
  const from = startOfLocalDay(now);
  if (preset === "7d") from.setDate(from.getDate() - 6);
  if (preset === "30d") from.setDate(from.getDate() - 29);

  return {
    createdFrom: from.toISOString(),
    createdTo: endOfLocalDay(now).toISOString(),
  };
}

export function operationDatePresetLabel(preset: OperationDatePreset) {
  switch (preset) {
    case "today":
      return "Hôm nay";
    case "7d":
      return "7 ngày gần nhất";
    case "30d":
      return "30 ngày gần nhất";
    case "all":
      return "Tất cả thời gian";
  }
}
