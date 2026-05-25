import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  clearToken,
  getToken,
  markExplicitLogout,
  setAccessToken,
} from "@/lib/auth-token";
import { API_BASE_URL } from "@/lib/constants";

type RefreshPayload = {
  accessToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
};

type RefreshResponse = {
  success?: boolean;
  data?: RefreshPayload;
  accessToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
};

let isRefreshing = false;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
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

function readRefreshPayload(response: RefreshResponse): RefreshPayload {
  return response.data ?? {
    accessToken: response.accessToken,
    accessTokenExpiresIn: response.accessTokenExpiresIn,
    refreshTokenExpiresIn: response.refreshTokenExpiresIn,
  };
}

export function clearAccessTokenRefreshTimer() {
  if (!refreshTimer) return;
  clearTimeout(refreshTimer);
  refreshTimer = null;
}

function redirectToLogin() {
  markExplicitLogout();
  clearToken();
  clearAccessTokenRefreshTimer();

  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    "auth-session-expired-message",
    "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
  );

  const { pathname } = window.location;
  if (pathname !== "/login") {
    window.location.href = "/login?reason=session-expired";
  }
}

function isRefreshSessionDenied(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) return false;
  return [401, 403].includes(error.response.status);
}

function shouldSkipPermissionMessage(url: string) {
  return url.includes("/auth/refresh") || url.includes("/auth/logout");
}

async function refreshAccessTokenFromCookie() {
  const response = await axiosInstance.post<RefreshResponse>("/auth/refresh", {});
  const payload = readRefreshPayload(response.data);
  const accessToken = payload.accessToken ?? "";

  if (!accessToken) {
    throw new Error("Refresh response missing accessToken");
  }

  setAccessToken(accessToken);
  scheduleAccessTokenRefresh(payload.accessTokenExpiresIn);
  return accessToken;
}

export function scheduleAccessTokenRefresh(expiresInSeconds?: number | null) {
  clearAccessTokenRefreshTimer();

  if (typeof window === "undefined" || !expiresInSeconds || expiresInSeconds <= 0) {
    return;
  }

  const refreshInMs = Math.max((expiresInSeconds - 120) * 1000, 30_000);
  refreshTimer = setTimeout(() => {
    refreshAccessTokenFromCookie().catch((error) => {
      if (isRefreshSessionDenied(error)) {
        redirectToLogin();
      }
    });
  }, refreshInMs);
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
  config.withCredentials = true;
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
    const requestUrl = originalRequest.url ?? "";

    if (status === 403 && !shouldSkipPermissionMessage(requestUrl)) {
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

    if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh")) {
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
      const accessToken = await refreshAccessTokenFromCookie();
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
