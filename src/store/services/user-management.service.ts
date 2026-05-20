import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  CreateManagedUserPayload,
  ImportUsersPreviewResult,
  ManagedRole,
  ManagedUser,
  ManagedUserDetail,
  ManagedUserStatus,
  ResetUserPasswordPayload,
  UserStatistics,
  UpdateManagedUserPayload,
  UpdateUserRolesPayload,
} from "@/types/user-management";

export type GetUsersParams = {
  page?: number;
  size?: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  keyword?: string;
  role?: string;
  active?: boolean | "";
  status?: ManagedUserStatus | "";
};

function buildUsersQueryParams(params: GetUsersParams = {}) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    keyword,
    role,
    active,
    status,
  } = params;
  const query: Record<string, string | number> = { page, size, sort, sortDir };
  if (keyword?.trim()) query.keyword = keyword.trim();
  if (role?.trim() && role !== "all") query.role = role.trim();
  if (typeof active === "boolean") query.active = String(active);
  else if (status === "ACTIVE") query.active = "true";
  else if (status === "LOCKED" || status === "DISABLED") query.active = "false";
  return query;
}

function userListTags(result?: ApiResponse<PagedResponse<ManagedUser>>) {
  const rows = result?.data?.content ?? [];
  return rows.length
    ? [
        ...rows.map((user) => ({ type: "User" as const, id: user.id })),
        { type: "User" as const, id: "LIST" },
        { type: "User" as const, id: "STATISTICS" },
      ]
    : [
        { type: "User" as const, id: "LIST" },
        { type: "User" as const, id: "STATISTICS" },
      ];
}

const userManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ApiResponse<PagedResponse<ManagedUser>>, GetUsersParams | void>({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params: buildUsersQueryParams(params ?? {}),
      }),
      transformResponse: (r: ApiResponse<ManagedUser[] | PagedResponse<ManagedUser>>) =>
        normalizeApiResponsePaged(r),
      providesTags: userListTags,
    }),

    getUserStatistics: builder.query<ApiResponse<UserStatistics>, void>({
      query: () => ({ url: "/users/statistics", method: "GET" }),
      providesTags: [{ type: "User" as const, id: "STATISTICS" }],
    }),

    getUserRoles: builder.query<ApiResponse<ManagedRole[]>, void>({
      query: () => ({ url: "/users/roles", method: "GET" }),
      providesTags: [{ type: "User" as const, id: "ROLES" }],
    }),

    getUserById: builder.query<ApiResponse<ManagedUser>, string>({
      query: (id) => ({ url: `/users/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "User" as const, id }],
    }),

    getUserDetail: builder.query<ApiResponse<ManagedUserDetail>, string>({
      query: (id) => ({ url: `/users/${id}/detail`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "User" as const, id }],
    }),

    createUser: builder.mutation<ApiResponse<ManagedUser>, CreateManagedUserPayload>({
      query: (body) => ({ url: "/users", method: "POST", data: body }),
      invalidatesTags: [
        { type: "User", id: "LIST" },
        { type: "User", id: "STATISTICS" },
      ],
    }),

    updateUser: builder.mutation<ApiResponse<ManagedUser>, UpdateManagedUserPayload>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PUT", data: body }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "User", id: "LIST" },
        { type: "User", id: "STATISTICS" },
      ],
    }),

    updateUserRoles: builder.mutation<ApiResponse<ManagedUser>, UpdateUserRolesPayload>({
      query: ({ id, roles }) => ({
        url: `/users/${id}/roles`,
        method: "PUT",
        data: { roles },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "User", id: "LIST" },
        { type: "User", id: "STATISTICS" },
      ],
    }),

    updateUserStatus: builder.mutation<ApiResponse<ManagedUser>, { id: string; status?: ManagedUserStatus }>({
      query: ({ id }) => ({
        url: `/users/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "User", id: "LIST" },
        { type: "User", id: "STATISTICS" },
      ],
    }),

    resetUserPassword: builder.mutation<ApiResponse<unknown>, ResetUserPasswordPayload>({
      query: ({ id, newPassword }) => ({
        url: `/users/${id}/reset-password`,
        method: "POST",
        data: { newPassword },
      }),
    }),

    previewImportUsers: builder.mutation<ApiResponse<ImportUsersPreviewResult>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/users/import/preview",
          method: "POST",
          data: formData,
        };
      },
    }),

    importUsers: builder.mutation<ApiResponse<ImportUsersPreviewResult>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/users/import",
          method: "POST",
          data: formData,
        };
      },
      invalidatesTags: [
        { type: "User", id: "LIST" },
        { type: "User", id: "STATISTICS" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserStatisticsQuery,
  useGetUserRolesQuery,
  useGetUserByIdQuery,
  useGetUserDetailQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserRolesMutation,
  useUpdateUserStatusMutation,
  useResetUserPasswordMutation,
  usePreviewImportUsersMutation,
  useImportUsersMutation,
} = userManagementApi;
