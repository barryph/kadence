import type { IUser } from './api.types';
import { apiClient, type OptionalOptions } from './api.client';

interface FetchUserResponse {
  user: IUser;
}

export const usersAPI = {
  getCurrentUser(options?: OptionalOptions) {
    return apiClient.get<FetchUserResponse>('/users/current', options);
  },
};
