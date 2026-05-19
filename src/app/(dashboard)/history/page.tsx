"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Calendar as CalendarIcon,
  Download,
  FileEdit,
  Filter,
  LogIn,
  PackagePlus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  DEFAULT_OPERATION_DATE_PRESET,
  getOperationDateRange,
  operationDatePresetLabel,
  type OperationDatePreset,
} from "@/lib/date-range";
import {
  WAREHOUSE_AUDIT_MODULES,
  getUserRoles,
  hasAnyRole,
} from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { useGetAuditLogsQuery } from "@/store/services/audit-log.service";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";
import { apiErrMessage } from "@/types/api";
import type { AuditLog } from "@/types/audit-log";

type LogType = "LOGIN" | "CREATE" | "UPDATE" | "DELETE" | "SYSTEM";

const TYPE_ICONS: Record<LogType, React.ReactNode> = {
  LOGIN: <LogIn className="h-4 w-4 text-emerald-600" />,
  CREATE: <PackagePlus className="h-4 w-4 text-indigo-600" />,
  UPDATE: <FileEdit className="h-4 w-4 text-amber-600" />,
  DELETE: <Trash2 className="h-4 w-4 text-rose-600" />,
  SYSTEM: <Activity className="h-4 w-4 text-slate-600" />,
};

const TYPE_STYLES: Record<LogType, string> = {
  LOGIN: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  CREATE: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400",
  UPDATE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  DELETE: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
  SYSTEM: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
};

const MODULE_OPTIONS = [
  { value: "ALL", label: "Tất cả module" },
  { value: "PURCHASE_ORDER", label: "Đơn nhập" },
  { value: "INBOUND_RECEIPT", label: "Phiếu nhập" },
  { value: "PUTAWAY", label: "Putaway" },
  { value: "RMA", label: "RMA / hàng trả" },
  { value: "SALES_ORDER", label: "Đơn xuất" },
  { value: "PICKING", label: "Picking" },
  { value: "STOCK", label: "Tồn kho" },
  { value: "PRODUCT", label: "Sản phẩm" },
  { value: "SUPPLIER", label: "Nhà cung cấp" },
  { value: "CATEGORY", label: "Danh mục" },
  { value: "CUSTOMER", label: "Khách hàng" },
  { value: "WAREHOUSE", label: "Kho" },
  { value: "LOCATION", label: "Vị trí" },
  { value: "CYCLE_COUNT", label: "Kiểm kê" },
  { value: "USER", label: "Người dùng" },
  { value: "AUTH", label: "Đăng nhập / xác thực" },
  { value: "SYSTEM", label: "Hệ thống" },
] as const;

const MODULE_LABEL: Record<string, string> = MODULE_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<string, string>,
);

const ACTION_LABEL: Record<string, string> = {
  ALL: "Tất cả loại",
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  APPROVE: "Duyệt",
  CANCEL: "Hủy",
  STOCK_ADJUST: "Điều chỉnh tồn",
  STOCK_RESERVE: "Giữ chỗ tồn",
  PICK: "Picking",
  PUTAWAY: "Putaway",
};

function toLogType(actionType: string | null | undefined): LogType {
  const type = (actionType ?? "").toUpperCase();
  if (type === "CREATE") return "CREATE";
  if (type === "DELETE") return "DELETE";
  if (type === "LOGIN") return "LOGIN";
  if (type === "SYSTEM") return "SYSTEM";
  return "UPDATE";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SYS";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function formatLogTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "---- -- --", time: "--:--:--" };
  }
  return {
    date: format(date, "yyyy-MM-dd"),
    time: format(date, "HH:mm:ss"),
  };
}

function entityLabel(log: AuditLog) {
  return log.entityName?.trim() || log.entityType || "N/A";
}

export default function HistoryPage() {
  const { data: user } = useGetCurrentUserQuery();
  const userRoles = getUserRoles(user?.roles);
  const isAdmin = hasAnyRole(userRoles, ["ADMIN"]);
  const isWarehouseManager = hasAnyRole(userRoles, ["WAREHOUSE_MANAGER"]);
  const canReadAuditLogs = isAdmin || isWarehouseManager;

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState<OperationDatePreset>(DEFAULT_OPERATION_DATE_PRESET);
  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 300);
  const dateRange = useMemo(() => getOperationDateRange(datePreset), [datePreset]);
  const moduleOptions = useMemo(() => {
    if (isAdmin) return MODULE_OPTIONS;
    const allowed = new Set<string>(["ALL", ...WAREHOUSE_AUDIT_MODULES]);
    return MODULE_OPTIONS.filter((option) => allowed.has(option.value));
  }, [isAdmin]);
  const effectiveModuleFilter = moduleOptions.some((option) => option.value === moduleFilter)
    ? moduleFilter
    : "ALL";

  const { data, isLoading, isFetching, error, refetch } = useGetAuditLogsQuery({
    page: 0,
    size: 50,
    module: effectiveModuleFilter,
    actionType: typeFilter,
    keyword: debouncedSearch,
    ...dateRange,
  }, {
    skip: !canReadAuditLogs,
  });

  const logs = useMemo(() => data?.data?.content ?? [], [data]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={isAdmin ? "Nhật ký hệ thống" : "Nhật ký nghiệp vụ kho"}
        description={
          isAdmin
            ? "Theo dõi toàn bộ thao tác hệ thống và nghiệp vụ."
            : "Theo dõi thao tác nghiệp vụ kho: nhập xuất, tồn kho, picking, putaway, kiểm kê và RMA."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 gap-2"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Tải lại
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 gap-2">
              <Download className="h-4 w-4" />
              Xuất dữ liệu
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm theo người dùng, thao tác, đối tượng..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 pl-9 rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>
          <Select value={effectiveModuleFilter} onValueChange={(value) => setModuleFilter(value || "ALL")}>
            <SelectTrigger className="h-10 w-[160px] rounded-xl border-slate-200 shrink-0 dark:border-slate-800">
              <Filter className="mr-2 h-4 w-4 text-slate-400" />
              <span className="truncate text-sm">{MODULE_LABEL[effectiveModuleFilter] ?? effectiveModuleFilter}</span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {moduleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={datePreset} onValueChange={(value) => setDatePreset(value as OperationDatePreset)}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl border-slate-200 shrink-0 dark:border-slate-800">
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
              <span className="truncate text-sm">{operationDatePresetLabel(datePreset)}</span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="today">{operationDatePresetLabel("today")}</SelectItem>
              <SelectItem value="7d">{operationDatePresetLabel("7d")}</SelectItem>
              <SelectItem value="30d">{operationDatePresetLabel("30d")}</SelectItem>
              <SelectItem value="all">{operationDatePresetLabel("all")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || "ALL")}>
            <SelectTrigger className="h-10 w-[190px] rounded-xl border-slate-200 shrink-0 dark:border-slate-800">
              <Filter className="mr-2 h-4 w-4 text-slate-400" />
              <span className="truncate text-sm">{ACTION_LABEL[typeFilter] ?? typeFilter}</span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="CREATE">Tạo mới</SelectItem>
              <SelectItem value="UPDATE">Cập nhật</SelectItem>
              <SelectItem value="DELETE">Xóa</SelectItem>
              <SelectItem value="APPROVE">Duyệt</SelectItem>
              <SelectItem value="CANCEL">Hủy</SelectItem>
              <SelectItem value="STOCK_ADJUST">Điều chỉnh tồn</SelectItem>
              <SelectItem value="STOCK_RESERVE">Giữ chỗ tồn</SelectItem>
              <SelectItem value="PICK">Picking</SelectItem>
              <SelectItem value="PUTAWAY">Putaway</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-transparent">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 pl-6 font-bold uppercase text-[11px] text-slate-400 w-[240px]">Người dùng</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-slate-400">Thao tác</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-slate-400 hidden lg:table-cell">Đối tượng</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-slate-400 hidden xl:table-cell">IP</TableHead>
              <TableHead className="py-4 pr-6 text-right font-bold uppercase text-[11px] text-slate-400">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-sm text-slate-500">
                  Đang tải nhật ký hoạt động...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-sm text-rose-600">
                  {apiErrMessage(error, "Không tải được nhật ký hoạt động.")}
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-sm text-slate-500">
                  Chưa có thao tác nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const type = toLogType(log.actionType);
                const actorName = log.actorName?.trim() || "system";
                const actorEmail = log.actorEmail?.trim() || log.serviceName;
                const created = formatLogTime(log.createdAt);

                return (
                  <TableRow key={log.id} className="group border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-200 bg-white">
                          <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-semibold dark:bg-indigo-950/50 dark:text-indigo-400">
                            {initials(actorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{actorName}</span>
                          <span className="text-[11px] text-slate-500">{actorEmail}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("inline-flex items-center justify-center p-1 rounded-md border", TYPE_STYLES[type])}>
                            {TYPE_ICONS[type]}
                          </span>
                          <span className="font-semibold text-slate-800 text-sm dark:text-slate-200">
                            {log.action}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400" title={log.reason ?? log.metadata ?? ""}>
                          {log.reason || log.metadata || `${log.module} / ${log.actionType}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 hidden lg:table-cell">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {entityLabel(log)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 hidden xl:table-cell text-sm text-slate-500 font-mono text-[12px]">
                      {log.ipAddress || "N/A"}
                    </TableCell>
                    <TableCell className="py-4 pr-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium text-slate-700 text-sm dark:text-slate-300">
                          {created.time}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {created.date}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
