import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  CreateManagedUserPayload,
  ManagedUser,
  ManagedUserStatus,
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
  status?: ManagedUserStatus | "";
};

function buildUsersQueryParams(params: GetUsersParams) {
  const {
    page = 0,
    size = 20,
    sort = "createdAt",
    sortDir = "desc",
    keyword,
    role,
    status,
  } = params;
  const query: Record<string, string | number> = { page, size, sort, sortDir };
  if (keyword?.trim()) query.keyword = keyword.trim();
  if (role?.trim()) query.role = role.trim();
  if (status) query.status = status;
  return query;
}

const userManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ApiResponse<PagedResponse<ManagedUser>>, GetUsersParams>({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params: buildUsersQueryParams(params),
      }),
      transformResponse: (r: ApiResponse<ManagedUser[] | PagedResponse<ManagedUser>>) =>
        normalizeApiResponsePaged(r),
      providesTags: (result) => {
        const rows = result?.data?.content ?? [];
        return rows.length
          ? [
              ...rows.map((user) => ({ type: "User" as const, id: user.id })),
              { type: "User" as const, id: "LIST" },
            ]
          : [{ type: "User" as const, id: "LIST" }];
      },
    }),

    getUserById: builder.query<ApiResponse<ManagedUser>, string>({
      query: (id) => ({ url: `/users/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "User" as const, id }],
    }),

    createUser: builder.mutation<ApiResponse<ManagedUser>, CreateManagedUserPayload>({
      query: (body) => ({ url: "/users", method: "POST", data: body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    updateUser: builder.mutation<ApiResponse<ManagedUser>, UpdateManagedUserPayload>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PUT", data: body }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "User", id: "LIST" },
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
      ],
    }),

    updateUserStatus: builder.mutation<ApiResponse<ManagedUser>, { id: string; status: ManagedUserStatus }>({
      query: ({ id, status }) => ({
        url: `/users/${id}/status`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserRolesMutation,
  useUpdateUserStatusMutation,
} = userManagementApi;
