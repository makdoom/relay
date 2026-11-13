import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types/auth';
import { apiClient } from './client';

/**
 * Auth API service interacting with Echo backend auth endpoints.
 * All requests use HttpOnly session cookies automatically managed by the browser (ADR-002, ADR-011).
 */

/**
 * Fetch the currently authenticated user session.
 * Throws ApiError (e.g. 401 Unauthorized) when no valid session exists.
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<AuthResponse>('/auth/me');
  return response.data.user;
}

/**
 * Register a new user in Echo.
 * Creates the user record and then establishes the session via login.
 */
export async function registerUser(input: RegisterInput): Promise<User> {
  // Step 1: Create user record
  await apiClient.post<AuthResponse>('/auth/register', input);

  // Step 2: Establish session cookies via login
  return loginUser({
    identifier: input.username,
    password: input.password,
  });
}

/**
 * Authenticate with existing username/email and password.
 * Backend sets HttpOnly session cookies and returns safe user profile.
 */
export async function loginUser(input: LoginInput): Promise<User> {
  const response = await apiClient.post<AuthResponse>('/auth/login', input);
  return response.data.user;
}

/**
 * Log out current session, revoking the refresh token and clearing authentication cookies.
 */
export async function logoutUser(): Promise<void> {
  await apiClient.post<{ message: string }>('/auth/logout');
}

/**
 * Rotate the current refresh token and obtain fresh session cookies.
 * Backend issues a new access token (15m) and rotated single-use refresh token (7d).
 */
export async function refreshAuthTokens(): Promise<User> {
  const response = await apiClient.post<AuthResponse>('/auth/refresh');
  return response.data.user;
}
