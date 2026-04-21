import { apiClient, type OptionalOptions } from "./api.client";

export interface IActivity {
  id: string;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
}

interface CreateActivityDTO extends Omit<Omit<IActivity, "id">, "userId"> {
  lastDone?: string;
};

interface CreateActivityResponse {
  activity: IActivity;
}

interface GetAllActivitiesByUserResponse {
  activities: IActivity[];
}

interface CompleteActivityResponse {
  activity: IActivity;
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

  complete(activityId: string, options?: OptionalOptions) {
    return apiClient.post<CompleteActivityResponse>(
      `/activities/${activityId}/complete`,
      {},
      options,
    );
  },
};
