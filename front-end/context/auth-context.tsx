import {
  createContext,
  useCallback,
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
import {
  ErrorCode,
  type ApiResponse,
  type AppError,
  type IUser,
} from '@/api/api.types';
import { usersAPI } from '@/api/api.users';
import LoaderScreen from '@/components/base/loader-screen';
import { queryClient } from '@/lib/query/client';
import { ApiError } from '@/lib/query/unwrap';
import {
  revokeGoogleAccess,
  signInWithGoogle as googleSignInClient,
} from '@/lib/auth/google';
import { signInWithApple as appleSignInClient } from '@/lib/auth/apple';
import { isSocialAuthError } from '@/lib/auth/errors';
import { onSessionExpired } from '@/lib/auth/session-expiry';
import { clearActivityQueue } from '@/lib/storage/activity-queue';
import {
  logLogin,
  logLoginFailed,
  logSignUp,
  logSignUpFailed,
} from '@/lib/analytics/analytics';
import type { AuthMethod } from '@/lib/analytics/events';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUser | null;
  /**
   * True when the session could not be restored because the server could not be
   * reached (offline, timed out, 5xx). Deliberately distinct from "signed out":
   * sending the user to the login screen would be wrong, because signing in
   * needs the same server. The host shows a retryable connection error instead.
   */
  isConnectionError: boolean;
  /** Retries the boot session restore after a connection error. */
  retrySessionRestore: () => void;
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
  deleteAccount: () => Promise<void>;
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

/**
 * A 401 means the server actively told us there is no usable session; every
 * other failure means we could not ask. Only the former is a sign-out.
 */
function isSessionEndedError(code: AppError['code']): boolean {
  return code === ErrorCode.UNAUTHORIZED || code === ErrorCode.SESSION_EXPIRED;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectionError, setIsConnectionError] = useState(false);
  // Prevents duplicate simultaneous sign-in requests.
  const socialAuthInFlight = useRef(false);
  // Mirrors `isAuthenticated` so the session-expiry handler can read the latest
  // value without being re-registered on every auth state change.
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  /**
   * Restores the session from the server on boot. A failure to reach the server
   * is *not* a signed-out user: it is surfaced as `isConnectionError` so the
   * navigation guard can offer a retry instead of a login screen that cannot
   * succeed without connectivity.
   */
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await usersAPI.getCurrentUser();

      if (response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        setIsConnectionError(false);
        return;
      }

      if (response.error && !isSessionEndedError(response.error.code)) {
        setIsConnectionError(true);
        return;
      }

      // Either a successful response with no user or an explicit 401: the user
      // is simply not signed in.
      setIsConnectionError(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setIsConnectionError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const retrySessionRestore = useCallback(() => {
    void restoreSession();
  }, [restoreSession]);

  /**
   * The server can end a session while the app is running: it expired, it was
   * signed out on another device, or a password reset revoked it — and a bare
   * 401 (no usable session presented at all) is reported the same way. The
   * credential is already dead, so clear the auth state and let the navigation
   * guard send the user back to sign-in. Local device data is kept: it is this
   * account's selection state, and clearing it would discard the user's list for
   * no reason. (Offline *writes* are not queued; the app expects a connection.)
   * The `isAuthenticated` guard keeps the boot-time `getCurrentUser` 401 from
   * disturbing a fresh, signed-out launch.
   */
  useEffect(() => {
    return onSessionExpired(() => {
      if (!isAuthenticatedRef.current) return;
      clearSessionState();
    });
  }, []);

  async function login(
    email: string,
    password: string,
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await authAPI.login({ email, password });
    if (response.error) {
      console.error('Error logging in', response.error);
      logLoginFailed('password', response.error.code);
    } else {
      setUser(response.data.user);
      setIsAuthenticated(true);
      setIsConnectionError(false);
      logLogin('password');
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

  /**
   * Deletes the authenticated user's account. The backend decides which
   * account to delete from the session alone; no identifier is ever sent.
   *
   * Google's documented disconnect flow applies only to accounts actually
   * linked to Google, so the linked providers are fetched from the server
   * first and `revokeAccess` is only attempted for Google-linked accounts.
   * The disconnect itself is best-effort — the app holds no Google API scopes
   * beyond OIDC identity, and failures must not block account deletion.
   *
   * On success all local auth state and the user's offline queue are cleared;
   * the navigation guard then redirects to the login screen. Throws `ApiError`
   * on failure so the UI can surface the reason; the account is left intact.
   */
  async function deleteAccount(): Promise<void> {
    // Resolved once: the lookup is a network round-trip against an endpoint the
    // deletion path then re-reads, and this runs immediately before an
    // irreversible action.
    if (await isGoogleLinked()) {
      try {
        await revokeGoogleAccess();
      } catch (err) {
        console.error(
          'Google revokeAccess failed during account deletion (best-effort)',
          err,
        );
      }
    }

    const response = await authAPI.deleteAccount();
    if (response.error) {
      // The account is already gone: treat as success (idempotent deletion).
      if (response.error.code === ErrorCode.ACCOUNT_NOT_FOUND) {
        clearLocalAccountState(user);
        return;
      }
      throw new ApiError(response.error);
    }

    clearLocalAccountState(user);
  }

  /**
   * Reports whether the authenticated account is linked to Google, from the
   * server's external-identity records. Fetching fresh here (rather than
   * reusing boot-time state) keeps the check authoritative even right after a
   * provider sign-in. When the lookup fails, the account is treated as not
   * Google-linked so no disconnect is attempted for it.
   */
  async function isGoogleLinked(): Promise<boolean> {
    try {
      const current = await usersAPI.getCurrentUser();
      return current.data?.authProviders.includes('google') ?? false;
    } catch (err) {
      console.error('Error fetching account providers before deletion', err);
      return false;
    }
  }

  /**
   * Drops local auth state only. Used when the server ends the session — an
   * expired or revoked credential is dead, but the user is not: the local
   * activity queue is this account's own selection state and is kept so the
   * user's list is still there when they sign back in. (Offline *writes* are
   * not queued or replayed; the app expects a connection while it is used.)
   */
  function clearSessionState() {
    setUser(null);
    setIsAuthenticated(false);
    setIsConnectionError(false);
    queryClient.clear();
  }

  /**
   * Drops local auth state *and* the account's local data. Only for account
   * deletion: the account is gone, so its queued activity has nowhere to go.
   * Uses the queue's own clearer so its in-memory cache is reset too, rather
   * than removing the stored key behind its back.
   */
  function clearLocalAccountState(account: IUser | null) {
    if (account) {
      void clearActivityQueue(account.id);
    }
    clearSessionState();
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
      logSignUpFailed('password', response.error.code);
    } else {
      setUser(response.data.user);
      setIsAuthenticated(true);
      setIsConnectionError(false);
      logSignUp('password');
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
    provider: () => Promise<{
      idToken: string;
      nonce?: string;
      authorizationCode?: string;
    }>,
    exchange: (
      idToken: string,
      nonce?: string,
      authorizationCode?: string,
    ) => Promise<ApiResponse<LoginResponse>>,
    method: AuthMethod,
  ): Promise<ApiResponse<LoginResponse>> {
    if (socialAuthInFlight.current) {
      console.error('Error: Social Auth In Flight');
      return toAppError(
        ErrorCode.SOCIAL_AUTH_FAILED,
        'A sign-in is already in progress.',
      );
    }
    socialAuthInFlight.current = true;

    try {
      let credential: {
        idToken: string;
        nonce?: string;
        authorizationCode?: string;
      };
      try {
        credential = await provider();
      } catch (err) {
        return mapSocialAuthError(err);
      }

      let response: ApiResponse<LoginResponse>;
      try {
        // FIXME: Why does this recursively call itself? It appears as though it
        // always calls itself and expects one to return `socialAuthInFlight` error
        response = await exchange(
          credential.idToken,
          credential.nonce,
          credential.authorizationCode,
        );
      } catch (err) {
        console.error('Error exchanging social credential', err);
        return toAppError(
          ErrorCode.SOCIAL_AUTH_FAILED,
          'Sign in failed. Please try again.',
        );
      }

      if (response.error) {
        console.error('Error signing in with provider', response.error);
        logLoginFailed(method, response.error.code);
        return response;
      }

      setUser(response.data.user);
      setIsAuthenticated(true);
      setIsConnectionError(false);
      logLogin(method);
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
      'google',
    );
  }

  function signInWithApple(): Promise<ApiResponse<LoginResponse>> {
    return performSocialSignIn(
      async () => appleSignInClient(),
      (idToken, nonce, authorizationCode) =>
        authAPI.appleLogin({
          idToken,
          nonce: nonce ?? '',
          authorizationCode: authorizationCode ?? '',
        }),
      'apple',
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
        isConnectionError,
        retrySessionRestore,
        login,
        logout,
        register,
        signInWithGoogle,
        signInWithApple,
        deleteAccount,
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
