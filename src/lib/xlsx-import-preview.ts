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
  /** Mỗi nhóm: ít nhất một tên cột phải có trong dòng tiêu đề (VD categoryId hoặc categoryCode). */
  requireAnyHeaderInEachGroup?: readonly (readonly string[])[];
  /** Mỗi dòng: trong mỗi nhóm, ít nhất một cột (có trong file) phải khác rỗng. */
  requireAnyValueInEachRowGroup?: readonly (readonly string[])[];
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

  for (const group of config.requireAnyHeaderInEachGroup ?? []) {
    const ok = group.some((g) => headerSet.has(g.toLowerCase()));
    if (!ok) {
      issues.push(
        `File thiếu nhóm danh mục: cần ít nhất một cột trong [${group.map((g) => label(g)).join(", ")}].`,
      );
    }
  }

  const required = config.requiredRowFields ?? [];
  const fieldIndices = required.map((field) => ({
    field,
    idx: headers.findIndex((h) => h.toLowerCase() === field.toLowerCase()),
  }));

  const rowValueGroups = (config.requireAnyValueInEachRowGroup ?? []).map((group) =>
    group
      .map((field) => ({
        field,
        idx: headers.findIndex((h) => h.toLowerCase() === field.toLowerCase()),
      }))
      .filter((x) => x.idx >= 0),
  );

  dataRows.forEach((r, idx) => {
    const line = idx + 2;
    for (const { field, idx: col } of fieldIndices) {
      if (col < 0) continue;
      const val = r[col]?.trim() ?? "";
      if (!val) {
        issues.push(`Dòng ${line} (trong Excel): chưa điền ${label(field)}.`);
      }
    }
    for (const group of rowValueGroups) {
      if (group.length === 0) continue;
      const anyFilled = group.some(({ idx: col }) => (r[col]?.trim() ?? "").length > 0);
      if (!anyFilled) {
        issues.push(
          `Dòng ${line} (trong Excel): cần điền ít nhất một trong [${group.map((g) => label(g.field)).join(", ")}].`,
        );
      }
    }
  });

  return { headers, dataRows, issues };
}

/** Đọc .xlsx (sheet đầu) + kiểm tra theo `config`. */
export async function buildImportPreviewFromXlsx(
  data: ArrayBuffer,
  config: XlsxImportPreviewConfig,
): Promise<ImportPreview | null> {
  const matrix = await readXlsxFirstSheetMatrix(data);
  return matrixToImportPreview(matrix, config);
}
