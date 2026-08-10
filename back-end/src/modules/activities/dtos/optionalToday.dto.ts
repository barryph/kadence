import { IsOptional, Matches } from 'class-validator';

export default class OptionalTodayQueryDTO {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'today must be in YYYY-MM-DD format',
  })
  today?: string;
}
