import type { IUser } from "../Layouts/AuthContext";
import { apiClient } from "./api.client";

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

interface RegisterResponse {
  user: IUser;
}

export const authAPI = {
  login(body: LoginDTO) {
    return apiClient.post<LoginResponse>('/auth/login', body);
  },

  logout() {
    return apiClient.delete<LoginResponse>('/auth/logout');
  },

  register(body: RegisterDTO) {
    return apiClient.post<RegisterResponse>('/auth/register', body);
  },
};
