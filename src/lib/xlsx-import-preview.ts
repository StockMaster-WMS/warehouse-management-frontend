/** Cấu hình + validate preview nhập — dùng chung; mỗi entity tự định nghĩa `XlsxImportPreviewConfig`. */
import { readXlsxFirstSheetMatrix } from "@/lib/xlsx-utils";

export type ImportPreview = {
  headers: string[];
  dataRows: string[][];
  issues: string[];
};

export type XlsxImportPreviewConfig = {
  /** Các cột phải có trong dòng tiêu đề (so khớp không phân biệt hoa thường). */
  expectedHeaders: readonly string[];
  /** Mỗi dòng dữ liệu: các cột này không được để trống. */
  requiredRowFields?: readonly string[];
  /** Nhãn hiển thị trong cảnh báo (key = tên cột trong file). */
  fieldLabels?: Readonly<Record<string, string>>;
};

function normalizeHeaderRow(matrix: string[][]): {
  headers: string[];
  dataRows: string[][];
} | null {
  if (matrix.length === 0) return null;
  const headers = matrix[0].map((h) => h.trim());
  if (!headers.some((h) => h.length > 0)) return null;
  const width = headers.length;
  const dataRows = matrix
    .slice(1)
    .map((row) => {
      const cells = [...row];
      while (cells.length < width) cells.push("");
      return cells.slice(0, width);
    })
    .filter((row) => row.some((c) => c.trim() !== ""));
  return { headers, dataRows };
}

/** Kiểm tra ma trận đã parse (dòng 1 = header). */
export function matrixToImportPreview(
  matrix: string[][],
  config: XlsxImportPreviewConfig,
): ImportPreview | null {
  const parsed = normalizeHeaderRow(matrix);
  if (!parsed) return null;

  const { headers, dataRows } = parsed;
  const issues: string[] = [];
  const headerSet = new Set(headers.map((h) => h.toLowerCase()));
  const label = (key: string) => config.fieldLabels?.[key] ?? key;

  for (const key of config.expectedHeaders) {
    if (!headerSet.has(key.toLowerCase())) {
      issues.push(`File thiếu cột «${label(key)}» (tên cột gợi ý: ${key}).`);
    }
  }

  const required = config.requiredRowFields ?? [];
  const fieldIndices = required.map((field) => ({
    field,
    idx: headers.findIndex((h) => h.toLowerCase() === field.toLowerCase()),
  }));

  dataRows.forEach((r, idx) => {
    const line = idx + 2;
    for (const { field, idx: col } of fieldIndices) {
      if (col < 0) continue;
      const val = r[col]?.trim() ?? "";
      if (!val) {
        issues.push(`Dòng ${line} (trong Excel): chưa điền ${label(field)}.`);
      }
    }
  });

  return { headers, dataRows, issues };
}

/** Đọc .xlsx (sheet đầu) + kiểm tra theo `config`. */
export function buildImportPreviewFromXlsx(
  data: ArrayBuffer,
  config: XlsxImportPreviewConfig,
): ImportPreview | null {
  const matrix = readXlsxFirstSheetMatrix(data);
  return matrixToImportPreview(matrix, config);
}
