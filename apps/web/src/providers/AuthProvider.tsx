import { useEffect, useState } from 'react';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAuthTokens,
  registerUser,
  setOnAuthFailure,
} from '@/api/auth.api';
import { ApiError } from '@/lib/error';
import type { LoginInput, RegisterInput, User } from '@/types/auth';
import { AuthContext, type AuthContextValue } from '../context/AuthContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Subscribe to auth failure events (e.g. refresh token expired or revoked in any tab)
  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
    });

    return () => {
      setOnAuthFailure(null);
    };
  }, []);

  // Hydrate session on application startup
  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Proactively refresh access token before it expires at 15 minutes (run every 14 minutes)
  useEffect(() => {
    if (!user) return;

    const FOURTEEN_MINUTES_MS = 14 * 60 * 1000;
    const interval = setInterval(() => {
      refreshAuthTokens().catch(() => {
        // Handled by setOnAuthFailure on unrecoverable rejection
      });
    }, FOURTEEN_MINUTES_MS);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const login = async (data: LoginInput) => {
    setError(null);
    try {
      const loggedInUser = await loginUser(data);
      setUser(loggedInUser);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login. Please try again.');
      }
      throw err;
    }
  };

  const register = async (data: RegisterInput) => {
    setError(null);
    try {
      const loggedInUser = await registerUser(data);
      setUser(loggedInUser);
    } catch (err) {
      console.log(err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during registration. Please try again.');
      }
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await logoutUser();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
