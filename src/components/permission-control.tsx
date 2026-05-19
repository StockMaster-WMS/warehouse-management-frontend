"use client";

import React from "react";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";
import { getUserRoles, hasAnyRole } from "@/lib/access-control";
import type { UserRole } from "@/store/services/auth.service";

interface PermissionControlProps {
  /** Nội dung hiển thị nếu có quyền */
  children: React.ReactNode;
  /** Danh sách các role được phép (ví dụ: ['ADMIN', 'WAREHOUSE_MANAGER']) */
  allowedRoles: UserRole | readonly UserRole[];
  /** Nội dung hiển thị nếu KHÔNG có quyền (mặc định là null) */
  fallback?: React.ReactNode;
}

/**
 * Component dùng để kiểm soát việc hiển thị nội dung dựa trên phân quyền (RBAC).
 * Ví dụ: 
 * <PermissionControl allowedRoles={['ADMIN']}>
 *   <button>Xóa hệ thống</button>
 * </PermissionControl>
 */
export function PermissionControl({
  children,
  allowedRoles,
  fallback = null,
}: PermissionControlProps) {
  const { data: user } = useGetCurrentUserQuery();
  
  if (!user) return fallback;

  const userRoles = getUserRoles(user.roles);
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (hasAnyRole(userRoles, rolesArray)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Hook tiện ích để kiểm tra quyền hạn trong logic code.
 */
export function useHasPermissions(allowedRoles: UserRole | readonly UserRole[]) {
  const { data: user } = useGetCurrentUserQuery();
  
  if (!user) return false;
  
  const userRoles = getUserRoles(user.roles);
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return hasAnyRole(userRoles, rolesArray);
}
