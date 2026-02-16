import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export default class CreateUserDTO {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
  @IsNotEmpty()
  passwordConfirm: string;
}
