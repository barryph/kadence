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
  @IsOptional()
  ticker?: string;
  @IsNotEmpty()
  @IsNumber()
  interval: number;
  @IsOptional()
  @IsNumber()
  categoryId?: number;
  @IsOptional()
  @IsString()
  lastDone?: string; // YYYY-MM-DD
}
