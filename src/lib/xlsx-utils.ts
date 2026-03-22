/** Tiện ích .xlsx dùng chung mọi entity (đọc/ghi file). */
import * as XLSX from "xlsx";

export type AoA = (string | number | boolean | null | undefined)[][];

/** Excel giới hạn 31 ký tự và một số ký tự cấm trong tên sheet. */
export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*[\]]/g, "_").trim();
  return (cleaned.slice(0, 31) || "Sheet1");
}

function ensureXlsxFilename(filename: string): string {
  return filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
}

/** Tải file .xlsx từ ma trận (dòng đầu = tiêu đề cột nếu bạn đặt như vậy). */
export function downloadAoAAsXlsx(filename: string, sheetName: string, rows: AoA) {
  if (rows.length === 0) return;
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName));
  XLSX.writeFile(wb, ensureXlsxFilename(filename));
}

/** Đọc sheet đầu tiên thành ma trận chuỗi (trim từng ô). */
export function readXlsxFirstSheetMatrix(data: ArrayBuffer): string[][] {
  const wb = XLSX.read(data, { type: "array" });
  const firstName = wb.SheetNames[0];
  if (!firstName) return [];
  const ws = wb.Sheets[firstName];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    blankrows: false,
  });
  return (raw ?? []).map((row) =>
    (Array.isArray(row) ? row : []).map((c) =>
      c === null || c === undefined ? "" : String(c).trim(),
    ),
  );
}
