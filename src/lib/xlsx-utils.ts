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

/** Yield main thread so the browser can repaint / handle events. */
function yieldThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Async wrapper: builds + downloads .xlsx without blocking the UI for the
 * entire duration.  Yields between heavy steps (build sheet → create workbook
 * → write file).
 */
export async function downloadAoAAsXlsx(filename: string, sheetName: string, rows: AoA) {
  if (rows.length === 0) return;
  const ws = XLSX.utils.aoa_to_sheet(rows);
  await yieldThread();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName));
  await yieldThread();
  XLSX.writeFile(wb, ensureXlsxFilename(filename));
}

/**
 * Async wrapper: reads the first sheet of an .xlsx ArrayBuffer into a string
 * matrix, yielding between parse → JSON → map steps.
 */
export async function readXlsxFirstSheetMatrix(data: ArrayBuffer): Promise<string[][]> {
  const wb = XLSX.read(data, { type: "array" });
  await yieldThread();

  const firstName = wb.SheetNames[0];
  if (!firstName) return [];
  const ws = wb.Sheets[firstName];
  if (!ws) return [];

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    blankrows: false,
  });
  await yieldThread();

  return (raw ?? []).map((row) =>
    (Array.isArray(row) ? row : []).map((c) =>
      c === null || c === undefined ? "" : String(c).trim(),
    ),
  );
}
