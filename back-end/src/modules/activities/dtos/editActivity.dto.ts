import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export default class EditActivityDTO {
  @ApiProperty({
    example: 'Read a book',
    description: 'The name of the activity',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({
    example: 'READ',
    description: 'A short ticker or abbreviation for the activity',
  })
  @IsString()
  @IsOptional()
  ticker?: string;

  @ApiProperty({
    example: 1,
    description: 'The interval in days between activities',
  })
  @IsNumber()
  @IsOptional()
  interval: number;
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
