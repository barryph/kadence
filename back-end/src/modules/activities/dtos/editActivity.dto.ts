import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export default class EditActivityDTO {
  @ApiProperty({ example: 'Read a book', description: 'The name of the activity' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'READ', description: 'A short ticker or abbreviation for the activity' })
  @IsString()
  @IsOptional()
  ticker?: string;

  @ApiProperty({ example: 1, description: 'The interval in days between activities' })
  @IsNumber()
  @IsNotEmpty()
  interval: number;
}
