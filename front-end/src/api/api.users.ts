import type { IUser } from "../Layouts/AuthContext";
import { apiClient } from "./api.client";

interface FetchUserResponse {
  user: IUser;
}

export const usersAPI = {
  getCurrentUser() {
    return apiClient.get<FetchUserResponse>('/users/current');
  },
};
