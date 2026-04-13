import type { UserRole } from "@/store/services/auth.service";

export type ManagedUserStatus = "ACTIVE" | "LOCKED" | "DISABLED";

export type ManagedUser = {
  id: string;
  username: string;
  email?: string | null;
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
  email?: string;
  name?: string;
  password: string;
  roles: UserRole[];
};

export type UpdateManagedUserPayload = {
  id: string;
  email?: string;
  name?: string;
  roles?: UserRole[];
  status?: ManagedUserStatus;
  isActive?: boolean;
};

export type UpdateUserRolesPayload = {
  id: string;
  roles: UserRole[];
};
