import { IsString, Matches } from 'class-validator';

export default class GetActivityEventsQueryDTO {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must be in YYYY-MM-DD format',
  })
  from: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must be in YYYY-MM-DD format',
  })
  to: string;
}

export interface ActivityEventDTO {
  activityId: string;
  categoryId: number | null;
  date: string;
}

export interface ActivityEventsDTO {
  events: ActivityEventDTO[];
}
