import {
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export default class CreateActivityDTO {
  @IsNotEmpty()
  @MaxLength(30)
  name: string;
  @MaxLength(5)
  ticker?: string;
  @IsNotEmpty()
  interval: number;
  @IsOptional()
  @IsNumber()
  categoryId?: number;
  @IsOptional()
  @IsString()
  lastDone?: string; // YYYY-MM-DD
}
