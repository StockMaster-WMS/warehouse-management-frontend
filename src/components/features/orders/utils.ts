export function formatOrderCreatedAt(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("vi-VN");
}
