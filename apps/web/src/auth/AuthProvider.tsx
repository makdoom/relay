import { useEffect, useState } from 'react';
import { getCurrentUser, loginUser, logoutUser, registerUser } from '@/api/auth.api';
import { ApiError } from '@/lib/error';
import type { LoginInput, RegisterInput, User } from '@/types/auth';
import { AuthContext, type AuthContextValue } from './AuthContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

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
