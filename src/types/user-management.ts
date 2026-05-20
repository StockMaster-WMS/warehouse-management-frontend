import type { UserRole } from "@/store/services/auth.service";

export type ManagedUserStatus = "ACTIVE" | "LOCKED" | "DISABLED";

export type ManagedUser = {
  id: string;
  username: string;
  email?: string | null;
  fullName?: string | null;
  name?: string | null;
  roles: UserRole | UserRole[] | string;
  status?: ManagedUserStatus;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateManagedUserPayload = {
  username: string;
  email: string;
  fullName: string;
  password: string;
  roles: UserRole[];
};

export type UpdateManagedUserPayload = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles?: UserRole[];
  isActive?: boolean;
};

export type UpdateUserRolesPayload = {
  id: string;
  roles: UserRole[];
};

export type ManagedRole = {
  id: string;
  code: UserRole | string;
  name: string;
  description?: string | null;
};

export type UserStatistics = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
};

export type ManagedUserDetail = {
  user: ManagedUser;
  statistics?: {
    active?: boolean;
    rolesCount?: number;
    createdAt?: string | null;
    recentAuditCount?: number;
  } | null;
  recentAuditLogs?: Array<Record<string, unknown>>;
};

export type ResetUserPasswordPayload = {
  id: string;
  newPassword: string;
};

export type ImportUsersPreviewResult = {
  totalRows: number;
  successCount: number;
  failedCount: number;
  users: ManagedUser[];
  errors: Array<{
    rowNumber: number;
    username?: string | null;
    email?: string | null;
    message: string;
  }>;
};
