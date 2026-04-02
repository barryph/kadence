import { IsNotEmpty, MaxLength } from 'class-validator';

export default class CreateCategoryDTO {
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsNotEmpty()
  @MaxLength(30)
  color: string;
}
