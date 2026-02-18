import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export default class CreateUserDTO {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @IsString()
  password: string;
  @IsNotEmpty()
  @IsString()
  passwordConfirm: string;
}
