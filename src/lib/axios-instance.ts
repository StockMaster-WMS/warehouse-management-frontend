import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  clearToken,
  getToken,
  markExplicitLogout,
  setAccessToken,
} from "@/lib/auth-token";
import { API_BASE_URL } from "@/lib/constants";

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

function redirectToLogin() {
  markExplicitLogout();
  clearToken();

  if (typeof window === "undefined") return;

  const { pathname } = window.location;
  if (pathname !== "/login") {
    window.location.href = "/login";
  }
}

function isRefreshSessionDenied(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) return false;
  return [401, 403].includes(error.response.status);
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!axios.isAxiosError(error) || !error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 403) {
      const requestUrl = originalRequest.url ?? "";
      const message =
        requestUrl.includes("/picking-items/") || requestUrl.includes("/putaway-tasks/")
          ? "Bạn chỉ được thao tác nhiệm vụ được phân công cho bạn."
          : "Bạn không có quyền thực hiện thao tác này.";
      const responseData = error.response.data;
      error.response.data =
        responseData && typeof responseData === "object"
          ? { ...responseData, message }
          : { message };
      return Promise.reject(error);
    }

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";

    if (requestUrl.includes("/auth/login")) {
      return Promise.reject(error);
    }

    if (requestUrl.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers && token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axiosInstance.post("/auth/refresh", {});
      const { accessToken } = response.data.data;

      setAccessToken(accessToken);
      processQueue(null, accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      if (isRefreshSessionDenied(refreshError)) {
        redirectToLogin();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
