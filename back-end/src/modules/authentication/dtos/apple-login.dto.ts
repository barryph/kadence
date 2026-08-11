import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export default class AppleLoginDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  idToken: string;

  // The raw, unhashed nonce generated for this authentication attempt. Apple
  // embeds its SHA-256 hash in the token's `nonce` claim, which the backend
  // compares against.
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  nonce: string;
}
