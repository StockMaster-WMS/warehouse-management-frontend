import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";

export interface LoginRequest {
    username?: string; // username hoặc email
    email?: string;    // email hoặc username
    password: string;
}

export type UserRole = "WAREHOUSE_STAFF" | "WAREHOUSE_MANAGER" | "REPORT_VIEWER" | "ADMIN";

// HttpOnly Cookie: refreshToken sẽ được backend set, không trả về trong body
export interface LoginResponse {
    accessToken: string;
    user?: {
        id: string;
        username: string;
        email: string;
        name?: string;
        fullName?: string;
        roles: UserRole;
    };
}

export interface UpdateProfileRequest {
    name: string;
    email: string;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

// Refresh token được gửi tự động qua cookie, backend không cần nhận refreshToken từ body
export interface RefreshTokenResponse {
    accessToken: string;
    // refreshToken: ở HttpOnly cookie
}

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                data: credentials,
            }),
            transformResponse: (r: ApiResponse<LoginResponse>) => r.data,
        }),
        // RefreshToken được gửi tự động qua cookie, không cần payload
        refreshToken: builder.mutation<RefreshTokenResponse, void>({
            query: () => ({
                url: "/auth/refresh",
                method: "POST",
                data: {}, // Cookie sẽ tự động gửi, body có thể empty
            }),
            transformResponse: (r: ApiResponse<RefreshTokenResponse>) => r.data,
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),
            transformResponse: () => undefined,
        }),
        getCurrentUser: builder.query<LoginResponse["user"], void>({
            query: () => ({
                url: "/auth/me",
                method: "GET",
            }),
            transformResponse: (r: ApiResponse<LoginResponse["user"]>) => r.data,
            providesTags: [{ type: "Auth", id: "CURRENT_USER" }],
            keepUnusedDataFor: 0,
        }),
        updateProfile: builder.mutation<ApiResponse<LoginResponse["user"]>, UpdateProfileRequest>({
            query: (body) => ({
                url: "/auth/profile",
                method: "PUT",
                data: body,
            }),
            invalidatesTags: [{ type: "Auth", id: "CURRENT_USER" }],
        }),
        changePassword: builder.mutation<ApiResponse<void>, ChangePasswordRequest>({
            query: (body) => ({
                url: "/auth/change-password",
                method: "POST",
                data: body,
            }),
        }),
    }),
});

export const { 
    useLoginMutation, 
    useRefreshTokenMutation, 
    useLogoutMutation, 
    useGetCurrentUserQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation
} = authApi;
