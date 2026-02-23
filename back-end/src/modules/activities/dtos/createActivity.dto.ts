import { IsNotEmpty, MaxLength } from 'class-validator';

export default class CreateActivityDTO {
  @IsNotEmpty()
  @MaxLength(30)
  name: string;
  @MaxLength(5)
  ticker?: string;
  @IsNotEmpty()
  interval: number;
}
