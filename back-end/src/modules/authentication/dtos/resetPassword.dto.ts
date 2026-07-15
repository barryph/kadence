import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export default class ResetPasswordDTO {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @MinLength(8)
  @IsString()
  password: string;
}
