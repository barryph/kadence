import { IsNotEmpty, IsString, Matches } from 'class-validator';

export default class ActivityDateActionDTO {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;
}
