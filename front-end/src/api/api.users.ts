import type { IUser } from "../Layouts/AuthContext";
import { apiClient, type OptionalOptions } from "./api.client";

interface FetchUserResponse {
  user: IUser;
}

export const usersAPI = {
  getCurrentUser(options?: OptionalOptions) {
    return apiClient.get<FetchUserResponse>('/users/current', options);
  },
};
