import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  authAPI,
  type LoginResponse,
  type RegisterResponse,
} from '../api/api.auth';
import type { ApiResponse, AppError, IUser } from '@/api/api.types';
import { ErrorCode } from '@/api/api.types';
import { usersAPI } from '@/api/api.users';
import LoaderScreen from '@/components/base/loader-screen';
import { queryClient } from '@/lib/query/client';
import { signInWithApple as appleSignInClient } from '@/lib/auth/apple';
import { signInWithGoogle as googleSignInClient } from '@/lib/auth/google';
import { isSocialAuthError } from '@/lib/auth/errors';

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
  signInWithGoogle: () => Promise<ApiResponse<LoginResponse>>;
  signInWithApple: () => Promise<ApiResponse<LoginResponse>>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

function toAppError(
  code: AppError['code'],
  message: string,
): ApiResponse<LoginResponse> {
  return { error: { code, message } };
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Prevents duplicate simultaneous sign-in requests.
  const socialAuthInFlight = useRef(false);

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
    queryClient.clear();
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

  /**
   * Runs a provider sign-in, then exchanges the verified credential with the
   * backend. Only the backend decides which application account is
   * authenticated. Provider-specific errors are normalised so the UI can react
   * (e.g. cancellation is not shown as an error).
   */
  async function performSocialSignIn(
    provider: () => Promise<{ idToken: string; nonce?: string }>,
    exchange: (
      idToken: string,
      nonce?: string,
    ) => Promise<ApiResponse<LoginResponse>>,
  ): Promise<ApiResponse<LoginResponse>> {
    if (socialAuthInFlight.current) {
      return toAppError(
        ErrorCode.SOCIAL_AUTH_FAILED,
        'A sign-in is already in progress.',
      );
    }
    socialAuthInFlight.current = true;

    try {
      let credential: { idToken: string; nonce?: string };
      try {
        credential = await provider();
      } catch (err) {
        return mapSocialAuthError(err);
      }

      let response: ApiResponse<LoginResponse>;
      try {
        response = await exchange(credential.idToken, credential.nonce);
      } catch (err) {
        console.error('Error exchanging social credential', err);
        return toAppError(
          ErrorCode.SOCIAL_AUTH_FAILED,
          'Sign in failed. Please try again.',
        );
      }

      if (response.error) {
        console.error('Error signing in with provider', response.error);
        return response;
      }

      setUser(response.data.user);
      setIsAuthenticated(true);
      return response;
    } finally {
      socialAuthInFlight.current = false;
    }
  }

  function mapSocialAuthError(err: unknown): ApiResponse<LoginResponse> {
    if (isSocialAuthError(err)) {
      switch (err.code) {
        case 'cancelled':
          return toAppError(
            ErrorCode.SOCIAL_AUTH_CANCELLED,
            'Sign in was cancelled.',
          );
        case 'unavailable':
          return toAppError(ErrorCode.SOCIAL_AUTH_UNAVAILABLE, err.message);
        case 'network':
          return toAppError(
            ErrorCode.NETWORK_ERROR,
            'Network error. Please check your connection.',
          );
        default:
          return toAppError(
            ErrorCode.SOCIAL_AUTH_FAILED,
            'Sign in failed. Please try again.',
          );
      }
    }
    return toAppError(
      ErrorCode.SOCIAL_AUTH_FAILED,
      'Sign in failed. Please try again.',
    );
  }

  function signInWithGoogle(): Promise<ApiResponse<LoginResponse>> {
    return performSocialSignIn(
      async () => googleSignInClient(),
      (idToken) => authAPI.googleLogin({ idToken }),
    );
  }

  function signInWithApple(): Promise<ApiResponse<LoginResponse>> {
    return performSocialSignIn(
      async () => appleSignInClient(),
      (idToken, nonce) => authAPI.appleLogin({ idToken, nonce: nonce ?? '' }),
    );
  }

  if (isLoading) {
    return <LoaderScreen text="Loading..." />;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        register,
        signInWithGoogle,
        signInWithApple,
      }}
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
