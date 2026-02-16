import { IsEmail, IsNotEmpty } from 'class-validator';

export default class LoginDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
}
