import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export default class GoogleLoginDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  idToken: string;
}
