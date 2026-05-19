export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/** Mảng phẳng hoặc body phân trang → luôn `PagedResponse` (dùng chung cho `transformResponse`).
 *  Backend có thể trả camelCase (totalElements) hoặc snake_case (total_elements). */
export function asPagedResponse<T>(
  data: T[] | PagedResponse<T>,
): PagedResponse<T> {
  if (Array.isArray(data)) {
    const n = data.length;
    return {
      content: data,
      page: 0,
      size: n,
      total_elements: n,
      total_pages: n === 0 ? 0 : 1,
    };
  }
  const d = data as unknown as Record<string, unknown>;
  return {
    content: (d.content ?? []) as T[],
    page: Number(d.page ?? 0),
    size: Number(d.size ?? 0),
    total_elements: Number(d.total_elements ?? d.totalElements ?? 0),
    total_pages: Number(d.total_pages ?? d.totalPages ?? 0),
  };
}

/** `ApiResponse.data` là mảng hoặc `PagedResponse` → luôn `PagedResponse`. */
export function normalizeApiResponsePaged<T>(
  r: ApiResponse<T[] | PagedResponse<T>>,
): ApiResponse<PagedResponse<T>> {
  const inner = r.data;
  if (inner == null) {
    return {
      ...r,
      data: {
        content: [],
        page: 0,
        size: 0,
        total_elements: 0,
        total_pages: 0,
      },
    };
  }
  return { ...r, data: asPagedResponse(inner) };
}

/** Message từ RTK/axios (`error.data.message`, v.v.). */
export function apiErrMessage(
  error: unknown,
  fallback = "Đã xảy ra lỗi. Vui lòng thử lại.",
): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const e = error as { data?: unknown; message?: string; error?: string; status?: unknown };
    if (e.status === 403 || e.status === "403") {
      return "Bạn không có quyền thực hiện thao tác này.";
    }
    if (typeof e.error === "string" && e.error.trim()) return e.error;
    if (typeof e.message === "string" && e.message.trim()) return e.message;
    const d = e.data;
    if (typeof d === "string" && d.trim()) return d;
    if (
      d &&
      typeof d === "object" &&
      "message" in d &&
      typeof (d as { message: string }).message === "string"
    ) {
      const m = (d as { message: string }).message;
      if (m) return m;
    }
  }
  return fallback;
}

export function apiErrStatus(error: unknown): string | number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const s = (error as { status: unknown }).status;
    if (typeof s === "number" || typeof s === "string") return s;
  }
  return undefined;
}

export function taskScopeErrMessage(error: unknown): string {
  return apiErrStatus(error) === 403 || apiErrStatus(error) === "403"
    ? "Bạn chỉ được thao tác nhiệm vụ được phân công cho bạn."
    : apiErrMessage(error);
}
