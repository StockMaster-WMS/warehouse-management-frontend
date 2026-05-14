<<<<<<< HEAD
import axios, { InternalAxiosRequestConfig } from "axios";
import { getToken, clearToken, setAccessToken } from "@/lib/auth-token";
=======
import axios from "axios";
import { getToken, clearToken, markExplicitLogout } from "@/lib/auth-token";
>>>>>>> feature/loctrantran
import { API_BASE_URL } from "@/lib/constants";
import { toast } from "sonner";

// Hàng đợi lưu các request bị tạm dừng khi đang refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Quan trọng để gửi HttpOnly cookie (RefreshToken)
});

// Request Interceptor: Đính kèm Access Token vào mọi request
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Tự động xử lý FormData (nếu có)
  if (config.data instanceof FormData && config.headers) {
    const h = config.headers;
    if (typeof h.delete === "function") {
      h.delete("Content-Type");
    } else {
      delete (h as Record<string, unknown>)["Content-Type"];
    }
  }

  return config;
});

// Response Interceptor: Xử lý lỗi 401 (Refresh Token) và 403 (Phân quyền)
axiosInstance.interceptors.response.use(
  (response) => response,
<<<<<<< HEAD
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!axios.isAxiosError(error) || !error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;

    // 1. Xử lý lỗi 403: Không có quyền (RBAC)
    if (status === 403) {
      toast.error("Bạn không có quyền thực hiện chức năng này");
      return Promise.reject(error);
    }

    // 2. Xử lý lỗi 401: Unauthorized (Token hết hạn)
    if (status === 401 && !originalRequest._retry) {
      // Bỏ qua nếu là endpoint login hoặc refresh bị lỗi
      if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
        if (originalRequest.url?.includes("/auth/refresh")) {
          clearToken();
          if (typeof window !== "undefined") {
            const { pathname } = window.location;
            if (pathname !== "/login") {
              window.location.href = "/login";
            }
          }
=======
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (typeof window !== "undefined") {
        markExplicitLogout();
        clearToken();
        const { pathname } = window.location;
        if (pathname !== "/login") {
          window.location.href = "/login";
>>>>>>> feature/loctrantran
        }
        return Promise.reject(error);
      }

      // Nếu đang có một tiến trình refresh token khác, xếp hàng chờ
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = "Bearer " + token;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh token
        const response = await axiosInstance.post("/auth/refresh", {});
        const { accessToken } = response.data.data;
        
        // Lưu token mới vào bộ nhớ
        setAccessToken(accessToken);
        
        // Giải phóng hàng đợi
        processQueue(null, accessToken);
        
        // Thực hiện lại request ban đầu với token mới
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = "Bearer " + accessToken;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Nếu refresh thất bại, xóa sạch session và về Login
        processQueue(refreshError, null);
        clearToken();
        if (typeof window !== "undefined") {
          const { pathname } = window.location;
          if (pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

