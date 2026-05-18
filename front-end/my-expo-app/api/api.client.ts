import { ErrorCode, type ApiResponse, type ServerResponse } from "./api.types";
import { errorMapper } from "./errorHandler";
import { Platform } from "react-native";

export interface OptionalOptions {
  signal?: AbortSignal;
}

// const BASE_URL = 'https://yummy-cooks-train.loca.lt';
// const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
// const BASE_URL = Platform.OS === 'android' ? 'https://9d68-203-211-79-9.ngrok-free.app' : 'http://localhost:3000';
const BASE_URL = 'http://localhost:3000';

class APIClient {
  async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
      console.log('Full URL', fullUrl);
      const response = await fetch(fullUrl, {
        // Set your default options here
        ...options,
        credentials: "include",
        headers: new Headers({
          "Content-Type": "application/json",
          "bypass-tunnel-reminder": "true",
          ...options.headers,
        }),
      });

      if (options.method === 'DELETE') {
        return { data: undefined as T };
      }

      const json: ServerResponse<T> = await response.json();
      if (json.error) {
        return {
          error: errorMapper.mapError(json.error),
        };
      }

      return {
        data: json.data!,
      }
    } catch (error) {
      // Fetch only throws an error for specific network conditions, or permission/configuration issues
      console.error('Error while making request', error);
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
    }
  }

  async get<T>(url: string, options: OptionalOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: "GET", ...options });
  }

  async post<T>(url: string, body: Record<string, any>, options: OptionalOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    });
  }

  async put<T>(url: string, body: Record<string, any>, options: OptionalOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    });
  }

  async delete<T>(url: string, options: OptionalOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: "DELETE", ...options });
  }
}

export const apiClient = new APIClient();
