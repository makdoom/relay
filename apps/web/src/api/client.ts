import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/lib/error';
import { executeTokenRefresh, normalizeError } from './tokenRefresh';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Singleton Axios HTTP client instance for Echo Web application.
 * Configured per ADR-011 with withCredentials: true for HttpOnly cookie authentication (ADR-002).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor to handle transparent 401 token refresh and normalize backend API errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    // Check if error is 401 Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      const url = originalRequest.url || '';

      // Skip refresh for unauthenticated/session endpoints to avoid recursion or false retries
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/logout');

      if (!isAuthEndpoint && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          await executeTokenRefresh();
          return apiClient(originalRequest);
        } catch (refreshErr) {
          return Promise.reject(normalizeError(refreshErr));
        }
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export default apiClient;
