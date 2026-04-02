import { apiClient, type OptionalOptions } from "./api.client";

export interface IActivity {
  id: string;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
}

type CreateActivityDTO = Omit<Omit<IActivity, "id">, "userId">;

interface CreateActivityResponse {
  activity: IActivity;
}

interface GetAllActivitiesByUserResponse {
  activities: IActivity[];
}

export const activitiesAPI = {
  createActivity(body: CreateActivityDTO, options?: OptionalOptions) {
    return apiClient.post<CreateActivityResponse>("/activities", body, options);
  },

  getAllByUser(options?: OptionalOptions) {
    return apiClient.get<GetAllActivitiesByUserResponse>(
      "/activities",
      options,
    );
  },
};
