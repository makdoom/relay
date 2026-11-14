import axios from 'axios';
import { ApiError, type ApiErrorResponse } from '@/lib/error';
import type { AuthResponse, User } from '@/types/auth';

type AuthFailureCallback = () => void;
let authFailureCallback: AuthFailureCallback | null = null;

/**
 * Register a listener to be called when session refresh fails completely
 * (e.g. refresh token expired, revoked, or session invalid).
 */
export const setOnAuthFailure = (cb: AuthFailureCallback | null) => {
  authFailureCallback = cb;
};

/**
 * Trigger the registered auth failure callback.
 */
export const triggerAuthFailure = () => {
  if (authFailureCallback) {
    authFailureCallback();
  }
};

/**
 * Normalizes any error (AxiosError, ApiError, Error, unknown) into an ApiError.
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.response?.data?.error) {
      const { code, message, details } = error.response.data.error;
      return new ApiError(
        message || 'An unexpected error occurred',
        code || 'UNKNOWN_ERROR',
        error.response.status,
        details
      );
    }

    if (error.request) {
      return new ApiError(
        'Unable to connect to the Relay server. Please check your network.',
        'NETWORK_ERROR',
        0
      );
    }

    return new ApiError(
      error.message || 'An unexpected error occurred',
      'REQUEST_SETUP_ERROR',
      500
    );
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 'UNKNOWN_ERROR', 500);
  }

  return new ApiError('An unexpected error occurred', 'UNKNOWN_ERROR', 500);
}

// Multi-tab synchronization via BroadcastChannel
let authChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    authChannel = new BroadcastChannel('relay_auth_sync');
    authChannel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'AUTH_FAILURE' || event.data?.type === 'AUTH_LOGOUT') {
        triggerAuthFailure();
      }
    };
  }
} catch {
  // Ignore environments where BroadcastChannel is unavailable
}

/**
 * Notify all open tabs that a user has logged out.
 */
export const broadcastLogout = () => {
  try {
    authChannel?.postMessage({ type: 'AUTH_LOGOUT' });
  } catch {
    // Ignore channel broadcast error
  }
};

// Single-flight in-memory promise for in-progress refresh request
let inFlightRefreshPromise: Promise<User> | null = null;

/**
 * Execute refresh token rotation with single-flight deduplication.
 * Ensures only one /auth/refresh HTTP request is in-flight at any time,
 * preventing race conditions and inadvertent token family revocation.
 */
export async function executeTokenRefresh(): Promise<User> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    try {
      // Direct call using base axios to bypass apiClient response interceptors
      const response = await axios.post<AuthResponse>(
        '/api/v1/auth/refresh',
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const user = response.data.user;

      try {
        authChannel?.postMessage({ type: 'REFRESH_SUCCESS' });
      } catch {
        // Ignore channel broadcast error
      }

      return user;
    } catch (err: unknown) {
      const normalized = normalizeError(err);

      // Only notify auth failure if it's an authentication rejection (401 Unauthorized)
      // Transient network errors should not force a logout
      if (normalized.status === 401) {
        try {
          authChannel?.postMessage({ type: 'AUTH_FAILURE' });
        } catch {
          // Ignore channel broadcast error
        }
        triggerAuthFailure();
      }

      throw normalized;
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}
