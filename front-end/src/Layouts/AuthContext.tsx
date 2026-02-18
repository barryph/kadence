import { createContext, useContext, useEffect, useState } from "react";
import { authAPI, type LoginResponse } from "../api/api.auth";
import type { ApiResponse } from "../api/api.types";
import { usersAPI } from "../api/api.users";

export interface IUser {
  id: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  login: (email: string, password: string) => Promise<ApiResponse<LoginResponse>>;
  logout: () => Promise<void>;
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
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [])

  async function login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await authAPI.login({
      email,
      password,
    });
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

  if (isLoading) {
    return (
      <div>Loading user...</div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
