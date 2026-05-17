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
  module?: string;
  actionType?: string;
  entityType?: string;
  keyword?: string;
};

function buildAuditQueryParams(params: GetAuditLogsParams) {
  const { page = 0, size = 20, module, actionType, entityType, keyword } = params;

  const query: Record<string, string | number> = {
    page,
    size,
  };

  const m = module?.trim();
  if (m && m !== "ALL") query.module = m;

  const at = actionType?.trim();
  if (at && at !== "ALL") query.actionType = at;

  const et = entityType?.trim();
  if (et && et !== "ALL") query.entityType = et;

  const k = keyword?.trim();
  if (k) query.keyword = k;

  return query;
}

const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<ApiResponse<PagedResponse<AuditLog>>, GetAuditLogsParams | void>({
      query: (params) => ({
        url: "/audit-logs",
        method: "GET",
        params: buildAuditQueryParams(params || {}),
      }),
      transformResponse: (r: ApiResponse<AuditLog[] | PagedResponse<AuditLog>>) =>
        normalizeApiResponsePaged(r),
      providesTags: [{ type: "AuditLog", id: "LIST" }],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogApi;
