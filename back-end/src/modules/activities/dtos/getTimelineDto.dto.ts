import { IsString } from 'class-validator';

export default class GetActivityTimelineDTO {
  @IsString()
  month: string;
}
// TODO: Define response
export interface ActivityTimelineDTO { }

// query param month
// {
//   "activityId": [
//     "YYYY-MM-DD",
//     "YYYY-MM-DD",
//     "YYYY-MM-DD",
//     ...
//   ],
//     "activityId": [
//       ...
//   ],
//   ...
// }
