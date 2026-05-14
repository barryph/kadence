import { apiClient, type OptionalOptions } from "./api.client";

export interface IActivity {
  id: string;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
  categoryId?: string;
  daysUntil: number;
}

interface CreateActivityDTO extends Omit<Omit<Omit<IActivity, "id">, "userId">, "daysUntil"> {
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

interface GetActivityByIdResponse {
  activity: IActivity;
}

interface EditActivityDTO {
  name: string;
  ticker?: string;
  interval: number;
}

interface EditActivityResponse {
  activity: IActivity;
}

export interface ICategory {
  name: string,
  color: string,
}

export const activitiesAPI = {
  getById(activityId: string, options?: OptionalOptions) {
    return apiClient.get<GetActivityByIdResponse>(
      `/activities/${activityId}`,
      options,
    );
  },

  editActivity(activityId: string, body: EditActivityDTO, options?: OptionalOptions) {
    return apiClient.post<EditActivityResponse>(
      `/activities/edit/${activityId}`,
      body,
      options,
    );
  },

  createActivity(body: CreateActivityDTO, options?: OptionalOptions) {
    return apiClient.post<CreateActivityResponse>("/activities", body, options);
  },

  getAllByUser(options?: OptionalOptions) {
    return apiClient.get<GetAllActivitiesByUserResponse>(
      "/activities",
      options,
    );
  },

  complete(activityId: string, date: string, options?: OptionalOptions) {
    return apiClient.post<CompleteActivityResponse>(
      `/activities/${activityId}/complete`,
      { date },
      options,
    );
  },

  undo(activityId: string, date: string, options?: OptionalOptions) {
    return apiClient.post<CompleteActivityResponse>(
      `/activities/${activityId}/undo`,
      { date },
      options,
    );
  },
};
