import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type { AuditLog } from "@/types/audit-log";

export type GetAuditLogsParams = {
  page?: number;
  size?: number;
  actionType?: string;
  keyword?: string;
};

const AUDIT_ENDPOINTS = [
  "/products/audit-logs",
  "/stocks/audit-logs",
  "/inbound/audit-logs",
  "/outbound/audit-logs",
] as const;

function buildAuditQueryParams(params: GetAuditLogsParams) {
  const query: Record<string, string | number> = {
    page: 0,
    size: Math.max(params.size ?? 50, 50),
  };
  const actionType = params.actionType?.trim();
  if (actionType && actionType !== "ALL") query.actionType = actionType;
  const keyword = params.keyword?.trim();
  if (keyword) query.keyword = keyword;
  return query;
}

function toPagedResponse(rows: AuditLog[], page: number, size: number): PagedResponse<AuditLog> {
  const start = page * size;
  const content = rows.slice(start, start + size);
  return {
    content,
    page,
    size,
    total_elements: rows.length,
    total_pages: rows.length === 0 ? 0 : Math.ceil(rows.length / size),
  };
}

const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<ApiResponse<PagedResponse<AuditLog>>, GetAuditLogsParams>({
      queryFn: async (params = {}, _api, _extraOptions, baseQuery) => {
        const page = params.page ?? 0;
        const size = params.size ?? 20;
        const queryParams = buildAuditQueryParams({ ...params, size: Math.max(size * 2, 50) });

        const results = await Promise.all(
          AUDIT_ENDPOINTS.map((url) =>
            baseQuery({
              url,
              method: "GET",
              params: queryParams,
            }),
          ),
        );

        const successful = results.filter((result) => !result.error);
        if (successful.length === 0) {
          const failed = results.find((result) => result.error);
          return { error: failed?.error ?? { status: undefined, data: "Không tải được nhật ký" } };
        }

        const rows = successful
          .flatMap((result) => {
            const response = result.data as ApiResponse<AuditLog[] | PagedResponse<AuditLog>> | undefined;
            return normalizeApiResponsePaged(response ?? {
              success: true,
              message: "OK",
              data: [],
              timestamp: new Date().toISOString(),
            }).data.content;
          })
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

        return {
          data: {
            success: true,
            message: "Lấy nhật ký hoạt động thành công",
            data: toPagedResponse(rows, page, size),
            timestamp: new Date().toISOString(),
          },
        };
      },
      providesTags: [{ type: "AuditLog", id: "LIST" }],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogApi;
