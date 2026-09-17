import {
  ErrorCode,
  type ApiResponse,
  type AppError,
  type ServerResponse,
} from './api.types';
import { errorMapper } from './errorHandler';
import { notifySessionExpired } from '@/lib/auth/session-expiry';

export interface OptionalOptions {
  signal?: AbortSignal;
}

const BASE_URL = process.env.EXPO_PUBLIC_SERVER_URL;

/**
 * `EXPO_PUBLIC_*` values are inlined when the bundle is built, so a build made
 * without them cannot be repaired at runtime. Without this guard the request
 * URL became the literal string "undefined/activities", fetch rejected with a
 * TypeError, and the user was told to check their connection - a configuration
 * failure disguised as a network one.
 */
const MISSING_CONFIG_MESSAGE =
  'This build is missing its server configuration and cannot connect. Please install the latest version.';

if (!BASE_URL && __DEV__) {
  console.error(
    'EXPO_PUBLIC_SERVER_URL is not set. Add it to .env (or the EAS environment for this build profile).',
  );
}

/**
 * How long a single request may take before it is aborted. Exported so tests
 * and callers can reason about the bound instead of duplicating it.
 */
export const REQUEST_TIMEOUT_MS = 20_000;

const TIMEOUT_MESSAGE =
  'The server took too long to respond. Please try again.';

/**
 * An aborted `fetch` rejects with a `DOMException`/`Error` named `AbortError`,
 * not a `TypeError`. Without this the abort escaped `request()` as a thrown
 * rejection instead of an `ApiResponse` error.
 */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: string }).name === 'AbortError'
  );
}

/**
 * Reads the JSON body, tolerating responses that are not JSON.
 *
 * Reverse proxies return text/HTML for 502/504, and a failed `response.json()`
 * used to escape `request()` as a rejection. Callers on the auth screens await
 * the result without a try/catch, so the screen stayed on its loading spinner
 * forever with no message.
 */
async function readJson<T>(
  response: Response,
): Promise<ServerResponse<T> | null> {
  try {
    return (await response.json()) as ServerResponse<T>;
  } catch {
    return null;
  }
}

/** Maps a failed response to the app's error envelope. */
function toError(
  response: Response,
  json: ServerResponse<unknown> | null,
): AppError {
  const error = errorMapper.mapError(
    json?.error ?? { code: '', message: '' },
    response.status,
  );

  // A session the server has ended is broadcast to the auth layer: the
  // credential is already dead, so the app must drop local auth state instead
  // of retrying (or showing a generic failure) on every request. UNAUTHORIZED
  // is the bare, unlabelled 401 (no usable session was presented);
  // SESSION_EXPIRED is the labelled form the API sends when it knows a session
  // existed and has ended.
  if (
    error.code === ErrorCode.UNAUTHORIZED ||
    error.code === ErrorCode.SESSION_EXPIRED
  ) {
    // Only the auth layer can end the session, and only the API layer can see
    // the 401, so they are connected through this callback.
    notifySessionExpired();
  }

  return error;
}

class APIClient {
  async request<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    if (!BASE_URL) {
      return {
        error: {
          code: ErrorCode.GENERIC_ERROR,
          message: MISSING_CONFIG_MESSAGE,
        },
      };
    }

    // React Native's Android networking is built on OkHttp with connect/read
    // timeouts of 0, i.e. "wait forever". A connection that is accepted but
    // never answered (captive portal, half-open socket, a proxy that stalled)
    // therefore never settles, and anything awaiting it - including the boot
    // session check - hangs indefinitely instead of failing. Bound every
    // request instead and report the timeout as a network failure.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const externalSignal = options.signal;
    const onExternalAbort = () => controller.abort();

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort);
      }
    }

    try {
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
      const response = await fetch(fullUrl, {
        // Set your default options here
        ...options,
        signal: controller.signal,
        credentials: 'include',
        headers: new Headers({
          'Content-Type': 'application/json',
          ...options.headers,
        }),
      });

      const json = await readJson<T>(response);

      if (json?.error) {
        return { error: toError(response, json) };
      }

      if (!response.ok) {
        return { error: toError(response, json) };
      }

      // A 204/DELETE may legitimately have no body.
      if (!json) {
        return { data: undefined as T };
      }

      return {
        data: json.data!,
      };
    } catch (error) {
      // An abort is ours (timeout) or the caller's. Either way the request
      // never produced a response, which is a connectivity failure from the
      // user's point of view.
      if (isAbortError(error)) {
        return {
          error: {
            code: ErrorCode.NETWORK_ERROR,
            message: externalSignal?.aborted
              ? 'The request was cancelled.'
              : TIMEOUT_MESSAGE,
          },
        };
      }

      // Fetch only throws an error for specific network conditions, or permission/configuration issues
      // Network error
      if (error instanceof TypeError) {
        return {
          error: {
            code: ErrorCode.NETWORK_ERROR,
            message: 'Network error. Please check your connection.',
          },
        };
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  async get<T>(
    url: string,
    options: OptionalOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', ...options });
  }

  async post<T>(
    url: string,
    body: Record<string, any>,
    options: OptionalOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  }

  async put<T>(
    url: string,
    body: Record<string, any>,
    options: OptionalOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  }

  async delete<T>(
    url: string,
    options: OptionalOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', ...options });
  }
}

export const apiClient = new APIClient();
