import axios, { type AxiosError } from 'axios';
import { ApiError, type ApiErrorResponse } from '@/lib/error';

/**
 * Singleton Axios HTTP client instance for Echo Web application.
 * Configured per ADR-011 with withCredentials: true for HttpOnly cookie authentication (ADR-002).
 */
export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor to normalize backend API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.data?.error) {
      const { code, message, details } = error.response.data.error;
      return Promise.reject(
        new ApiError(
          message || 'An unexpected error occurred',
          code || 'UNKNOWN_ERROR',
          error.response.status,
          details
        )
      );
    }

    if (error.request) {
      return Promise.reject(
        new ApiError(
          'Unable to connect to the Relay server. Please check your network.',
          'NETWORK_ERROR',
          0
        )
      );
    }

    return Promise.reject(
      new ApiError(error.message || 'An unexpected error occurred', 'REQUEST_SETUP_ERROR', 500)
    );
  }
);

export default apiClient;
