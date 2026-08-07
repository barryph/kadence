import { apiClient, type OptionalOptions } from './api.client';
import { ICategory } from './api.categories';

export interface IActivity {
  id: number;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
  categoryId?: number;
  category?: ICategory;
  daysUntil: number;
}

// Extend IActivity for client-side properties
export interface IActivityClient extends IActivity {
  queued?: boolean;
  completedToday?: boolean;
}

interface CreateActivityDTO extends Omit<
  Omit<Omit<IActivity, 'id'>, 'userId'>,
  'daysUntil'
> {
  lastDone?: string;
}

interface CreateActivityResponse {
  activity: IActivity;
}

interface GetAllActivitiesByUserResponse {
  activities: IActivity[];
}

interface GetActivityByIdResponse {
  activity: IActivity;
}

interface EditActivityDTO {
  name: string;
  ticker?: string;
  interval: number;
  categoryId: number | null;
}

interface EditActivityResponse {
  activity: IActivity;
}

interface CompleteActivityResponse {
  activity: IActivity;
}

interface UndoActivityResponse {
  activity: IActivity;
}

interface DeleteActivityResponse {
  id: number | string;
}

export const activitiesAPI = {
  getById(activityId: number | string, options?: OptionalOptions) {
    return apiClient.get<GetActivityByIdResponse>(
      `/activities/${activityId}`,
      options,
    );
  },

  editActivity(
    activityId: number | string,
    body: EditActivityDTO,
    options?: OptionalOptions,
  ) {
    return apiClient.put<EditActivityResponse>(
      `/activities/edit/${activityId}`,
      body,
      options,
    );
  },

  createActivity(body: CreateActivityDTO, options?: OptionalOptions) {
    return apiClient.post<CreateActivityResponse>('/activities', body, options);
  },

  getAllByUser(options?: OptionalOptions) {
    return apiClient.get<GetAllActivitiesByUserResponse>(
      '/activities',
      options,
    );
  },

  complete(
    activityId: number | string,
    date: string,
    options?: OptionalOptions,
  ) {
    return apiClient.post<CompleteActivityResponse>(
      `/activities/${activityId}/complete`,
      { date },
      options,
    );
  },

  undo(activityId: number | string, date: string, options?: OptionalOptions) {
    return apiClient.post<UndoActivityResponse>(
      `/activities/${activityId}/undo`,
      { date },
      options,
    );
  },

  deleteActivity(activityId: number | string, options?: OptionalOptions) {
    return apiClient.delete<DeleteActivityResponse>(
      `/activities/${activityId}`,
      options,
    );
  },
};
