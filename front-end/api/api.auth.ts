import type { IUser } from './api.types';
import { apiClient } from './api.client';

interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: IUser;
}

interface RegisterDTO {
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface RegisterResponse {
  user: IUser;
}

interface ForgotPasswordDTO {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordDTO {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const authAPI = {
  login(body: LoginDTO) {
    return apiClient.post<LoginResponse>('/auth/login', body);
  },

  logout() {
    return apiClient.delete<undefined>('/auth/logout');
  },

  register(body: RegisterDTO) {
    return apiClient.post<RegisterResponse>('/auth/register', body);
  },

  forgotPassword(body: ForgotPasswordDTO) {
    return apiClient.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      body,
    );
  },

  resetPassword(body: ResetPasswordDTO) {
    return apiClient.post<ResetPasswordResponse>('/auth/reset-password', body);
  },
};
