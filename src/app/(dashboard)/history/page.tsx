"use client";

import type { ReactNode } from "react";
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
type JsonRecord = Record<string, unknown>;

const TYPE_ICONS: Record<LogType, ReactNode> = {
  LOGIN: <LogIn className="size-4 text-emerald-600" />,
  CREATE: <PackagePlus className="size-4 text-primary" />,
  UPDATE: <FileEdit className="size-4 text-amber-600" />,
  DELETE: <Trash2 className="size-4 text-rose-600" />,
  SYSTEM: <Activity className="size-4 text-muted-foreground" />,
};

const TYPE_STYLES: Record<LogType, string> = {
  LOGIN: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  CREATE: "bg-primary/10 text-primary border-primary/20",
  UPDATE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  DELETE: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
  SYSTEM: "bg-muted text-muted-foreground border-border",
};

const MODULE_OPTIONS = [
  { value: "ALL", label: "Tất cả module" },
  { value: "PURCHASE_ORDER", label: "Đơn nhập" },
  { value: "INBOUND_RECEIPT", label: "Phiếu nhập" },
  { value: "PUTAWAY", label: "Xếp hàng lên kệ" },
  { value: "RMA", label: "Hàng trả" },
  { value: "SALES_ORDER", label: "Đơn xuất" },
  { value: "PICKING", label: "Lấy hàng" },
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
  PICK: "Lấy hàng",
  PUTAWAY: "Xếp hàng lên kệ",
  START_PICKING: "Bắt đầu lấy hàng",
  PACK: "Đóng gói",
  SHIP: "Xuất kho",
  HOLD: "Tạm dừng",
  RESUME: "Tiếp tục",
  ASSIGN: "Phân công",
  EXCEPTION: "Báo lỗi",
  DEACTIVATE: "Ngừng sử dụng",
};

const ENTITY_TYPE_LABEL: Record<string, string> = {
  PURCHASE_ORDER: "Đơn nhập",
  INBOUND_RECEIPT: "Phiếu nhập",
  PUTAWAY_TASK: "Nhiệm vụ xếp hàng",
  RMA: "Hàng trả",
  SALES_ORDER: "Đơn xuất",
  PICKING_ITEM: "Nhiệm vụ lấy hàng",
  STOCK_LEVEL: "Tồn kho",
  PRODUCT: "Sản phẩm",
  SUPPLIER: "Nhà cung cấp",
  CATEGORY: "Danh mục",
  CUSTOMER: "Khách hàng",
  WAREHOUSE: "Kho",
  LOCATION: "Vị trí",
  USER: "Người dùng",
  AI: "Trợ lý thông minh",
  SYSTEM: "Hệ thống",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  APPROVED: "Đã duyệt",
  CANCELLED: "Đã hủy",
  CLOSED: "Đã đóng",
  COMPLETED: "Hoàn tất",
  DRAFT: "Nháp",
  INACTIVE: "Ngừng hoạt động",
  ON_HOLD: "Tạm dừng",
  OPEN: "Đang mở",
  PACKED: "Đã đóng gói",
  PARTIAL: "Một phần",
  PENDING: "Chờ xử lý",
  PICKED: "Đã lấy hàng",
  PICKING: "Đang lấy hàng",
  RECEIVING: "Đang nhập",
  SHIPPED: "Đã xuất kho",
};

const SOURCE_LABEL: Record<string, string> = {
  PURCHASE_ORDER: "Đơn nhập",
  INBOUND_RECEIPT: "Phiếu nhập",
  SALES_ORDER: "Đơn xuất",
  PICKING_ITEM: "Lấy hàng",
  STOCK: "Tồn kho",
  SYSTEM: "Hệ thống",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_CONTAINS_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const UUID_GLOBAL_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const viNumberFormatter = new Intl.NumberFormat("vi-VN");

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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonRecord(value: string | null | undefined): JsonRecord {
  const trimmed = value?.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function looksLikeJson(value: string) {
  const trimmed = value.trim();
  return (trimmed.startsWith("{") && trimmed.endsWith("}"))
    || (trimmed.startsWith("[") && trimmed.endsWith("]"));
}

function isUuidLike(value: string) {
  return UUID_PATTERN.test(value.trim());
}

function stripTechnicalIds(value: string) {
  return value.replace(UUID_GLOBAL_PATTERN, "").replace(/\s{2,}/g, " ").trim();
}

function textValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || isUuidLike(trimmed) || looksLikeJson(trimmed)) return null;
    return trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return viNumberFormatter.format(value);
  }
  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }
  return null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstText(records: JsonRecord[], keys: string[]) {
  for (const record of records) {
    for (const key of keys) {
      const value = textValue(record[key]);
      if (value) return value;
    }
  }
  return null;
}

function firstNumber(records: JsonRecord[], keys: string[]) {
  for (const record of records) {
    for (const key of keys) {
      const value = numberValue(record[key]);
      if (value !== null) return value;
    }
  }
  return null;
}

function uniqueParts(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase("vi-VN");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function codeLabel(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (STATUS_LABEL[upper]) return STATUS_LABEL[upper];
  if (SOURCE_LABEL[upper]) return SOURCE_LABEL[upper];
  if (MODULE_LABEL[upper]) return MODULE_LABEL[upper];
  if (ENTITY_TYPE_LABEL[upper]) return ENTITY_TYPE_LABEL[upper];
  if (upper.length <= 3) return upper;
  return trimmed
    .replace(/_/g, " ")
    .toLocaleLowerCase("vi-VN")
    .replace(/(^|\s)\S/g, (match) => match.toLocaleUpperCase("vi-VN"));
}

function moduleLabel(value: string | null | undefined) {
  return codeLabel(value) ?? "Hệ thống";
}

function entityTypeLabel(value: string | null | undefined) {
  return codeLabel(value) ?? "Đối tượng";
}

function actionLabel(log: AuditLog) {
  const type = log.actionType?.trim().toUpperCase();
  return (type && ACTION_LABEL[type]) || log.action?.trim() || codeLabel(log.actionType) || "Thao tác";
}

function actionTitle(log: AuditLog) {
  const raw = log.action?.trim();
  if (!raw) return actionLabel(log);
  return stripTechnicalIds(raw) || actionLabel(log);
}

function readableReason(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || looksLikeJson(trimmed) || isUuidLike(trimmed)) return null;
  if (/^[A-Z0-9_]+$/.test(trimmed)) return null;
  const withoutIds = stripTechnicalIds(trimmed);
  return withoutIds || null;
}

function parseEntityNameParts(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || isUuidLike(trimmed) || looksLikeJson(trimmed)) return [];

  const parts: string[] = [];
  const beforeProductId = trimmed.split(/\s*\/\s*product=/i)[0]?.trim();
  if (beforeProductId && beforeProductId !== trimmed && beforeProductId.toUpperCase() !== "SO") {
    parts.push(beforeProductId);
  }

  for (const segment of trimmed.split(",")) {
    const [rawKey, ...rawValue] = segment.split("=");
    if (rawValue.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const valueText = rawValue.join("=").trim();
    if (!valueText || isUuidLike(valueText)) continue;
    if (/location/.test(key)) parts.push(`Vị trí ${valueText}`);
    else if (/lot/.test(key)) parts.push(`Lô ${valueText}`);
    else if (/sku/.test(key)) parts.push(`Mã hàng ${valueText}`);
    else if (!key.endsWith("id") && key !== "product") parts.push(valueText);
  }

  if (parts.length === 0 && !UUID_CONTAINS_PATTERN.test(trimmed)) {
    parts.push(trimmed);
  }

  return uniqueParts(parts);
}

function productLabel(records: JsonRecord[], log: AuditLog) {
  const sku = firstText(records, ["productSku", "sku"]);
  const productName = firstText(records, ["productName"]);
  const name = log.entityType === "PRODUCT" || log.module === "PRODUCT"
    ? firstText(records, ["name"])
    : null;
  return uniqueParts([sku, productName ?? name]).join(" - ") || null;
}

function businessCode(records: JsonRecord[]) {
  return firstText(records, [
    "poNumber",
    "soNumber",
    "salesOrderNumber",
    "receiptNumber",
    "rmaNumber",
    "code",
  ]);
}

function buildEntityLabel(log: AuditLog, records: JsonRecord[]) {
  const entityNameParts = parseEntityNameParts(log.entityName);
  const nameKey = ["SUPPLIER", "CUSTOMER", "WAREHOUSE", "LOCATION", "CATEGORY"].includes(log.entityType)
    || ["SUPPLIER", "CUSTOMER", "WAREHOUSE", "LOCATION", "CATEGORY"].includes(log.module)
    ? firstText(records, ["name"])
    : null;
  const product = productLabel(records, log);
  const locationCode = firstText(records, ["locationCode", "actualLocationCode", "suggestedLocationCode"]);
  const warehouseCode = firstText(records, ["warehouseCode"]);
  const lotNumber = firstText(records, ["lotNumber"]);
  const parts = uniqueParts([
    businessCode(records),
    product,
    nameKey,
    warehouseCode ? `Kho ${warehouseCode}` : null,
    locationCode ? `Vị trí ${locationCode}` : null,
    lotNumber ? `Lô ${lotNumber}` : null,
    ...entityNameParts,
  ]);

  return parts.length > 0 ? parts.join(" · ") : entityTypeLabel(log.entityType || log.module);
}

function appendStatusSummary(parts: string[], metadata: JsonRecord, before: JsonRecord, after: JsonRecord) {
  const beforeStatus = firstText([before], ["status"]);
  const afterStatus = firstText([after], ["status"]) ?? firstText([metadata], ["status"]);
  if (beforeStatus && afterStatus && beforeStatus.toUpperCase() !== afterStatus.toUpperCase()) {
    parts.push(`Trạng thái: ${codeLabel(beforeStatus)} -> ${codeLabel(afterStatus)}`);
  } else if (afterStatus) {
    parts.push(`Trạng thái: ${codeLabel(afterStatus)}`);
  }
}

function appendQuantitySummary(parts: string[], metadata: JsonRecord, before: JsonRecord, after: JsonRecord) {
  const qtyDelta = firstNumber([metadata], ["qtyDelta"]);
  if (qtyDelta && qtyDelta !== 0) {
    parts.push(`${qtyDelta > 0 ? "Tăng tồn" : "Giảm tồn"} ${viNumberFormatter.format(Math.abs(qtyDelta))}`);
  }

  const reservedDelta = firstNumber([metadata], ["reservedDelta"]);
  if (reservedDelta && reservedDelta !== 0) {
    parts.push(`${reservedDelta > 0 ? "Giữ chỗ" : "Nhả giữ chỗ"} ${viNumberFormatter.format(Math.abs(reservedDelta))}`);
  }

  const changedFields: Array<[string, string]> = [
    ["qtyOnHand", "Tồn tay"],
    ["qtyReserved", "Đang giữ chỗ"],
    ["qtyAvailable", "Khả dụng"],
    ["qtyPicked", "Đã pick"],
    ["qtyToPick", "Cần pick"],
    ["orderedQty", "Đặt hàng"],
    ["receivedQty", "Đã nhận"],
    ["shippedQty", "Đã xuất"],
  ];

  for (const [key, label] of changedFields) {
    const beforeNumber = firstNumber([before], [key]);
    const afterNumber = firstNumber([after], [key]);
    if (beforeNumber !== null && afterNumber !== null && beforeNumber !== afterNumber) {
      parts.push(`${label}: ${viNumberFormatter.format(beforeNumber)} -> ${viNumberFormatter.format(afterNumber)}`);
    }
  }

  const picked = firstNumber([after, metadata], ["qtyPicked"]);
  const toPick = firstNumber([after, metadata], ["qtyToPick"]);
  if (picked !== null && toPick !== null && !parts.some((part) => part.startsWith("Đã pick"))) {
    parts.push(`Tiến độ pick: ${viNumberFormatter.format(picked)}/${viNumberFormatter.format(toPick)}`);
  }
}

function buildAuditSummary(log: AuditLog, metadata: JsonRecord, before: JsonRecord, after: JsonRecord) {
  const parts: string[] = [];
  const records = [metadata, after, before];
  const reason = readableReason(log.reason);
  const exceptionReason = firstText(records, ["exceptionReason"]);

  if (reason) parts.push(reason);
  if (exceptionReason) parts.push(`Lý do: ${stripTechnicalIds(exceptionReason)}`);
  appendStatusSummary(parts, metadata, before, after);
  appendQuantitySummary(parts, metadata, before, after);

  const referenceType = firstText([metadata], ["referenceType"]);
  if (referenceType) {
    parts.push(`Nguồn: ${codeLabel(referenceType)}`);
  }

  const unique = uniqueParts(parts);
  if (unique.length > 0) {
    return unique.slice(0, 4).join(" · ");
  }

  return `${actionLabel(log)} trong ${moduleLabel(log.module)}`;
}

function buildAuditView(log: AuditLog) {
  const metadata = parseJsonRecord(log.metadata);
  const before = parseJsonRecord(log.beforeSnapshot);
  const after = parseJsonRecord(log.afterSnapshot);
  const records = [metadata, after, before];
  const status = firstText([after, metadata, before], ["status"]);
  const locationCode = firstText(records, ["locationCode", "actualLocationCode", "suggestedLocationCode"]);
  const lotNumber = firstText(records, ["lotNumber"]);
  const sku = firstText(records, ["productSku", "sku"]);
  const chips = uniqueParts([
    entityTypeLabel(log.entityType),
    status ? codeLabel(status) : null,
    sku ? `Mã hàng ${sku}` : null,
    locationCode ? `Vị trí ${locationCode}` : null,
    lotNumber ? `Lô ${lotNumber}` : null,
  ]).slice(0, 4);

  return {
    actionTitle: actionTitle(log),
    description: buildAuditSummary(log, metadata, before, after),
    entity: buildEntityLabel(log, records),
    module: moduleLabel(log.module),
    chips,
  };
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
            : "Theo dõi thao tác nghiệp vụ kho: nhập xuất, tồn kho, lấy hàng, xếp hàng lên kệ, kiểm kê và hàng trả."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-border gap-2"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
              Tải lại
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg border-border gap-2">
              <Download className="size-4" />
              Xuất dữ liệu
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo người dùng, thao tác, đối tượng..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 pl-9 rounded-lg border-border bg-background"
            />
          </div>
          <Select value={effectiveModuleFilter} onValueChange={(value) => setModuleFilter(value || "ALL")}>
            <SelectTrigger className="h-10 w-[160px] rounded-lg border-border shrink-0">
              <Filter className="mr-2 size-4 text-muted-foreground" />
              <span className="truncate text-sm">{MODULE_LABEL[effectiveModuleFilter] ?? effectiveModuleFilter}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {moduleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={datePreset} onValueChange={(value) => setDatePreset(value as OperationDatePreset)}>
            <SelectTrigger className="h-10 w-[180px] rounded-lg border-border shrink-0">
              <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
              <span className="truncate text-sm">{operationDatePresetLabel(datePreset)}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="today">{operationDatePresetLabel("today")}</SelectItem>
              <SelectItem value="7d">{operationDatePresetLabel("7d")}</SelectItem>
              <SelectItem value="30d">{operationDatePresetLabel("30d")}</SelectItem>
              <SelectItem value="all">{operationDatePresetLabel("all")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || "ALL")}>
            <SelectTrigger className="h-10 w-[190px] rounded-lg border-border shrink-0">
              <Filter className="mr-2 size-4 text-muted-foreground" />
              <span className="truncate text-sm">{ACTION_LABEL[typeFilter] ?? typeFilter}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="CREATE">Tạo mới</SelectItem>
              <SelectItem value="UPDATE">Cập nhật</SelectItem>
              <SelectItem value="DELETE">Xóa</SelectItem>
              <SelectItem value="APPROVE">Duyệt</SelectItem>
              <SelectItem value="CANCEL">Hủy</SelectItem>
              <SelectItem value="STOCK_ADJUST">Điều chỉnh tồn</SelectItem>
              <SelectItem value="STOCK_RESERVE">Giữ chỗ tồn</SelectItem>
              <SelectItem value="PICK">Lấy hàng</SelectItem>
              <SelectItem value="PUTAWAY">Xếp hàng lên kệ</SelectItem>
              <SelectItem value="START_PICKING">Bắt đầu lấy hàng</SelectItem>
              <SelectItem value="PACK">Đóng gói</SelectItem>
              <SelectItem value="SHIP">Xuất kho</SelectItem>
              <SelectItem value="HOLD">Tạm dừng</SelectItem>
              <SelectItem value="RESUME">Tiếp tục</SelectItem>
              <SelectItem value="ASSIGN">Phân công</SelectItem>
              <SelectItem value="EXCEPTION">Báo lỗi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 pl-6 font-bold uppercase text-[11px] text-muted-foreground w-[240px]">Người dùng</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-muted-foreground">Hoạt động</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-muted-foreground hidden lg:table-cell">Đối tượng</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-muted-foreground hidden xl:table-cell">Nghiệp vụ</TableHead>
              <TableHead className="py-4 pr-6 text-right font-bold uppercase text-[11px] text-muted-foreground">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">
                  Đang tải nhật ký hoạt động…
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
                <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">
                  Chưa có thao tác nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const type = toLogType(log.actionType);
                const actorName = log.actorName?.trim() || "system";
                const actorEmail = log.actorEmail?.trim() || log.serviceName;
                const created = formatLogTime(log.createdAt);
                const view = buildAuditView(log);

                return (
                  <TableRow key={log.id} className="group border-b border-border/60 last:border-0 hover:bg-muted/50">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-border bg-card">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initials(actorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-foreground">{actorName}</span>
                          <span className="text-[11px] text-muted-foreground">{actorEmail}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("inline-flex items-center justify-center p-1 rounded-md border", TYPE_STYLES[type])}>
                            {TYPE_ICONS[type]}
                          </span>
                          <span className="font-semibold text-foreground text-sm">
                            {view.actionTitle}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-1" title={view.description}>
                          {view.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 hidden lg:table-cell">
                      <div className="flex max-w-[360px] flex-col gap-1.5">
                        <span className="truncate text-sm font-medium text-foreground" title={view.entity}>
                          {view.entity}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {view.chips.map((chip) => (
                            <span
                              key={chip}
                              className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 hidden xl:table-cell">
                      <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {view.module}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 pr-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium text-foreground text-sm">
                          {created.time}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="size-3" />
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
