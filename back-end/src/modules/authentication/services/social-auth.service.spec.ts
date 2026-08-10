import { Test, TestingModule } from '@nestjs/testing';
import User from 'src/modules/users/domain/user.entity';
import UserEmail from 'src/modules/users/domain/value-objects/UserEmail';
import { GoogleProvider } from '../infrastructure/providers/google.provider';
import { AppleProvider } from '../infrastructure/providers/apple.provider';
import { ExternalIdentityService } from './external-identity.service';
import { SocialAuthService } from './social-auth.service';
import { OAuthCredentialError } from '../authentication.errors';

describe('SocialAuthService', () => {
  let service: SocialAuthService;
  let googleProvider: jest.Mocked<GoogleProvider>;
  let appleProvider: jest.Mocked<AppleProvider>;
  let externalIdentityService: jest.Mocked<ExternalIdentityService>;

  const makeUser = (id: string, email: string): User =>
    User.reconstitute({
      id,
      email: UserEmail.create(email),
      password: null,
    });

  beforeEach(async () => {
    googleProvider = {
      verifyIdToken: jest.fn(),
    } as unknown as jest.Mocked<GoogleProvider>;
    appleProvider = {
      verifyIdentityToken: jest.fn(),
    } as unknown as jest.Mocked<AppleProvider>;
    externalIdentityService = {
      resolveOrCreate: jest.fn(),
    } as unknown as jest.Mocked<ExternalIdentityService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialAuthService,
        { provide: GoogleProvider, useValue: googleProvider },
        { provide: AppleProvider, useValue: appleProvider },
        { provide: ExternalIdentityService, useValue: externalIdentityService },
      ],
    }).compile();

    service = module.get(SocialAuthService);
  });

  it('signs in with Google using the verified identity only', async () => {
    googleProvider.verifyIdToken.mockResolvedValue({
      provider: 'google',
      subject: 'google-subject-1',
      email: 'user@example.com',
    });
    externalIdentityService.resolveOrCreate.mockResolvedValue(
      makeUser('42', 'user@example.com'),
    );

    const user = await service.signInWithGoogle('google-id-token');

    expect(googleProvider.verifyIdToken).toHaveBeenCalledWith(
      'google-id-token',
    );
    expect(externalIdentityService.resolveOrCreate).toHaveBeenCalledWith({
      provider: 'google',
      subject: 'google-subject-1',
      email: 'user@example.com',
    });
    expect(user).toEqual({ id: '42', email: 'user@example.com' });
  });

  it('signs in with Apple using the verified identity only', async () => {
    appleProvider.verifyIdentityToken.mockResolvedValue({
      provider: 'apple',
      subject: 'apple-subject-1',
      email: 'user@example.com',
    });
    externalIdentityService.resolveOrCreate.mockResolvedValue(
      makeUser('43', 'user@example.com'),
    );

    const user = await service.signInWithApple('apple-id-token', 'raw-nonce');

    expect(appleProvider.verifyIdentityToken).toHaveBeenCalledWith(
      'apple-id-token',
      'raw-nonce',
    );
    expect(user.id).toBe('43');
  });

  it('propagates provider verification failures', async () => {
    googleProvider.verifyIdToken.mockRejectedValue(new OAuthCredentialError());

    await expect(service.signInWithGoogle('bad-token')).rejects.toThrow(
      OAuthCredentialError,
    );
    expect(externalIdentityService.resolveOrCreate).not.toHaveBeenCalled();
  });
});
