import { baseApi } from "@/store/services/api";
import type { ApiResponse } from "@/types/api";

export interface LoginRequest {
    username?: string; // username hoặc email
    email?: string;    // email hoặc username
    password: string;
}

// HttpOnly Cookie: refreshToken sẽ được backend set, không trả về trong body
export interface LoginResponse {
    accessToken: string; // Lưu vào localStorage
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
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
        }),
    }),
});

export const { useLoginMutation, useRefreshTokenMutation, useLogoutMutation, useGetCurrentUserQuery } = authApi;
