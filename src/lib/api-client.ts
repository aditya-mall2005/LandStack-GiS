import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

/**
 * LandStack — Unified Axios API Client
 * Configured with automatic role/persona header injection, timeout handling, and error normalization
 */

export const apiClient: AxiosInstance = axios.create({
  baseURL: "",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Attach LandStack User Context & Role Headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("landstack_active_user") || localStorage.getItem("landstack_user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user?.role) {
            config.headers.set("x-landstack-role", user.role);
          }
          if (user?.id) {
            config.headers.set("x-landstack-user-id", user.id);
          }
          if (user?.jurisdiction) {
            config.headers.set("x-landstack-jurisdiction", user.jurisdiction);
          }
        }
      } catch (e) {
        console.warn("Axios request header setup note:", e);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Error handling & telemetry
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with non-2xx status code
      console.warn(`[Axios API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} returned ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // Network failure or timeout
      console.error(`[Axios Network Error] No response received from ${error.config?.url}:`, error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
