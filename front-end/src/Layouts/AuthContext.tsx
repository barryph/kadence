import { createContext, useContext, useEffect, useState } from "react";

interface IUser {
  id: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  login: (email: string, password: string) => Promise<void>;
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
        const resp = await fetch('http://localhost:3000/users/current', {
          credentials: "include",
        });
        const json = await resp.json();
        console.log('json', json);
        if (json.user) {
          setUser(json.user);
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

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const resp = await fetch('http://localhost:3000/auth/login', {
        headers: new Headers({ "Content-Type": "application/json", }),
        method: 'POST',
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        })
      });
      if (!(resp.status === 201 || resp.status === 200)) {
        console.error('Failed to login', resp);
        throw new Error('Failed to login')
      }
      const json = await resp.json();
      console.log('json', json);
      console.log('user', json.user);
      setUser(json.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.log('Error logging in', err);
      throw err;
    }
    return true;
  }

  async function logout() {
    const resp = await fetch('http://localhost:3000/auth/logout', {
      method: 'DELETE',
      credentials: "include",
    });
    const json = await resp.json();
    if (resp.status !== 200) {
      console.warn('Logout didnt return 200');
    }
    console.log('json', json);
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
