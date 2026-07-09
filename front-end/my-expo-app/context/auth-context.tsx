import { createContext, useContext, useEffect, useState } from 'react';
import {
  authAPI,
  type LoginResponse,
  type RegisterResponse,
} from '../api/api.auth';
import type { ApiResponse, IUser } from '../api/api.types';
import { usersAPI } from '../api/api.users';
import LoaderScreen from '@/components/loader-screen';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUser | null;
  login: (
    email: string,
    password: string,
  ) => Promise<ApiResponse<LoginResponse>>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<ApiResponse<RegisterResponse>>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await usersAPI.getCurrentUser();
        if (response.data?.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  async function login(
    email: string,
    password: string,
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await authAPI.login({ email, password });
    if (response.error) {
      console.error('Error logging in', response.error);
    } else {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  }

  async function logout() {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Error logging out', err);
      throw err;
    }
    setUser(null);
    setIsAuthenticated(false);
  }

  async function register(
    email: string,
    password: string,
    passwordConfirm: string,
  ): Promise<ApiResponse<RegisterResponse>> {
    const response = await authAPI.register({
      email,
      password,
      passwordConfirm,
    });
    if (response.error) {
      console.error('Error registering:', response.error);
    } else {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  }

  if (isLoading) {
    return <LoaderScreen text="Loading user..." />;
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
