import { Injectable } from '@nestjs/common';
import { UserDTO, toDTO } from 'src/modules/users/mappers/userMap';
import { AppleProvider } from '../infrastructure/providers/apple.provider';
import { GoogleProvider } from '../infrastructure/providers/google.provider';
import { ExternalIdentityService } from './external-identity.service';

/**
 * Orchestrates OAuth sign-in: verify the provider credential, resolve or
 * create the application user, and return the user DTO for the session layer.
 *
 * The application session is established by the controller using the same
 * mechanism as email/password login; this service never creates a session and
 * never persists provider tokens.
 */
@Injectable()
export class SocialAuthService {
  constructor(
    private readonly googleProvider: GoogleProvider,
    private readonly appleProvider: AppleProvider,
    private readonly externalIdentityService: ExternalIdentityService,
  ) {}

  async signInWithGoogle(idToken: string): Promise<UserDTO> {
    const identity = await this.googleProvider.verifyIdToken(idToken);
    const user = await this.externalIdentityService.resolveOrCreate(identity);
    return toDTO(user);
  }

  async signInWithApple(idToken: string, nonce: string): Promise<UserDTO> {
    const identity = await this.appleProvider.verifyIdentityToken(
      idToken,
      nonce,
    );
    const user = await this.externalIdentityService.resolveOrCreate(identity);
    return toDTO(user);
  }
}
