import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
