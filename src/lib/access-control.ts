import type { UserRole } from "@/store/services/auth.service";

export const ALL_ROLES = [
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "WAREHOUSE_STAFF",
  "REPORT_VIEWER",
] as const satisfies UserRole[];

const ALL_ROLE_SET = new Set<UserRole>(ALL_ROLES);

export const ADMIN_MANAGER_ROLES = [
  "ADMIN",
  "WAREHOUSE_MANAGER",
] as const satisfies UserRole[];

export const AUDIT_LOG_ROLES = ADMIN_MANAGER_ROLES;

export const PICKING_ASSIGN_ROLES = ADMIN_MANAGER_ROLES;

export const WAREHOUSE_OPERATION_ROLES = [
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "WAREHOUSE_STAFF",
] as const satisfies UserRole[];

export const READ_OPERATION_ROLES = [
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "WAREHOUSE_STAFF",
] as const satisfies UserRole[];

export const INVENTORY_READ_ROLES = [
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "WAREHOUSE_STAFF",
  "REPORT_VIEWER",
] as const satisfies UserRole[];

export const REPORT_ROLES = [
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "REPORT_VIEWER",
] as const satisfies UserRole[];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  WAREHOUSE_MANAGER: "Quản lý kho",
  WAREHOUSE_STAFF: "Nhân viên kho",
  REPORT_VIEWER: "Người xem báo cáo",
};

export const WAREHOUSE_AUDIT_MODULES = [
  "PURCHASE_ORDER",
  "INBOUND_RECEIPT",
  "PUTAWAY",
  "RMA",
  "SALES_ORDER",
  "PICKING",
  "STOCK",
  "PRODUCT",
  "SUPPLIER",
  "CATEGORY",
  "CUSTOMER",
  "WAREHOUSE",
  "LOCATION",
  "CYCLE_COUNT",
] as const;

type RoleInput = string | string[] | null | undefined;

function normalizeRole(role: string): UserRole | null {
  const normalized = role.trim().replace(/^ROLE_/i, "");
  return ALL_ROLE_SET.has(normalized as UserRole)
    ? (normalized as UserRole)
    : null;
}

export function getUserRoles(input: RoleInput): UserRole[] {
  const values = Array.isArray(input) ? input : input?.split(",") ?? [];
  const roles: UserRole[] = [];
  for (const role of values) {
    const normalized = normalizeRole(role);
    if (normalized) roles.push(normalized);
  }
  return roles;
}

export function getRoleLabel(role: string | null | undefined): string {
  const normalized = role ? normalizeRole(role) : null;
  return normalized ? ROLE_LABELS[normalized] : role || "Chưa phân quyền";
}

export function hasAnyRole(
  userRoles: readonly UserRole[],
  allowedRoles: readonly UserRole[],
): boolean {
  const userRoleSet = new Set(userRoles);
  return allowedRoles.some((role) => userRoleSet.has(role));
}

type RouteAccessRule = {
  pattern: string;
  roles: readonly UserRole[];
};

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  { pattern: "/dashboard", roles: ALL_ROLES },
  { pattern: "/profile", roles: ALL_ROLES },
  { pattern: "/notifications", roles: ALL_ROLES },

  { pattern: "/inventory", roles: INVENTORY_READ_ROLES },
  { pattern: "/history", roles: AUDIT_LOG_ROLES },
  { pattern: "/reports", roles: REPORT_ROLES },

  { pattern: "/products/new", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/products/:id/edit", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/products/:id", roles: READ_OPERATION_ROLES },
  { pattern: "/products", roles: READ_OPERATION_ROLES },

  { pattern: "/categories/new", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/categories/:id/edit", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/categories/:id", roles: READ_OPERATION_ROLES },
  { pattern: "/categories", roles: READ_OPERATION_ROLES },

  { pattern: "/warehouses/new", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/warehouses/:id/edit", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/warehouses", roles: WAREHOUSE_OPERATION_ROLES },
  { pattern: "/locations", roles: WAREHOUSE_OPERATION_ROLES },
  { pattern: "/cycle-counts/:id", roles: WAREHOUSE_OPERATION_ROLES },
  { pattern: "/cycle-counts", roles: WAREHOUSE_OPERATION_ROLES },

  { pattern: "/inbound/new", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/inbound", roles: READ_OPERATION_ROLES },
  { pattern: "/purchase-orders/new", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/purchase-orders/:id", roles: READ_OPERATION_ROLES },
  { pattern: "/purchase-orders", roles: READ_OPERATION_ROLES },
  { pattern: "/putaway", roles: WAREHOUSE_OPERATION_ROLES },

  { pattern: "/orders/new", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/orders/:id", roles: READ_OPERATION_ROLES },
  { pattern: "/orders", roles: READ_OPERATION_ROLES },
  { pattern: "/picking", roles: WAREHOUSE_OPERATION_ROLES },
  { pattern: "/returns/:id", roles: READ_OPERATION_ROLES },
  { pattern: "/returns", roles: READ_OPERATION_ROLES },

  { pattern: "/customers/new", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/customers/:id/edit", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/customers/:id", roles: WAREHOUSE_OPERATION_ROLES },
  { pattern: "/customers", roles: WAREHOUSE_OPERATION_ROLES },
  { pattern: "/suppliers/new", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/suppliers/:id/edit", roles: ADMIN_MANAGER_ROLES },
  { pattern: "/suppliers/:id", roles: WAREHOUSE_OPERATION_ROLES },
  { pattern: "/suppliers", roles: WAREHOUSE_OPERATION_ROLES },

  { pattern: "/settings", roles: ["ADMIN"] },
  { pattern: "/security", roles: ["ADMIN"] },
  { pattern: "/ai-assistant", roles: READ_OPERATION_ROLES },
];

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0]?.replace(/\/+$/, "") || "/dashboard";
  return path === "" ? "/dashboard" : path;
}

function splitPathParts(pathname: string): string[] {
  const parts: string[] = [];
  for (const part of normalizePathname(pathname).split("/")) {
    if (part) parts.push(part);
  }
  return parts;
}

function matchRoutePattern(pattern: string, pathname: string): boolean {
  const patternParts = splitPathParts(pattern);
  const pathParts = splitPathParts(pathname);

  return patternParts.length === pathParts.length && patternParts.every((part, index) => {
    if (part.startsWith(":")) return Boolean(pathParts[index]);
    return part === pathParts[index];
  });
}

export function getAllowedRolesForPath(pathname: string): readonly UserRole[] {
  return (
    ROUTE_ACCESS_RULES.find((rule) => matchRoutePattern(rule.pattern, pathname))
      ?.roles ?? []
  );
}

export function canAccessPath(
  pathname: string,
  userRoles: readonly UserRole[],
): boolean {
  const allowedRoles = getAllowedRolesForPath(pathname);
  return allowedRoles.length > 0 && hasAnyRole(userRoles, allowedRoles);
}
