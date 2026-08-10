import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { signInWithGoogle } from '../google';
import { SocialAuthError } from '../errors';

const mockSignIn = jest.mocked(GoogleSignin.signIn);
const mockConfigure = jest.mocked(GoogleSignin.configure);

const successUser = {
  user: {
    id: 'google-123',
    name: 'Test User',
    email: 'test@example.com',
    photo: null,
    familyName: 'User',
    givenName: 'Test',
  },
  scopes: [],
  idToken: 'google-id-token',
  serverAuthCode: null,
};

describe('signInWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures with the web client ID and returns the id token', async () => {
    mockSignIn.mockResolvedValue({ type: 'success', data: successUser });

    const result = await signInWithGoogle();

    expect(mockConfigure).toHaveBeenCalledWith(
      expect.objectContaining({
        webClientId: expect.any(String),
      }),
    );
    expect(result.idToken).toBe('google-id-token');
  });

  it('throws a cancelled error when the user cancels', async () => {
    mockSignIn.mockResolvedValue({ type: 'cancelled', data: null });

    await expect(signInWithGoogle()).rejects.toMatchObject({
      name: 'SocialAuthError',
      code: 'cancelled',
    });
  });

  it('maps native cancellation codes', async () => {
    const error = new Error('cancelled') as Error & { code?: string };
    error.code = statusCodes.SIGN_IN_CANCELLED;
    mockSignIn.mockRejectedValue(error);

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: 'cancelled',
    });
  });

  it('maps missing play services to unavailable', async () => {
    const error = new Error('no play services') as Error & { code?: string };
    error.code = statusCodes.PLAY_SERVICES_NOT_AVAILABLE;
    mockSignIn.mockRejectedValue(error);

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: 'unavailable',
    });
  });

  it('fails when no id token is returned', async () => {
    mockSignIn.mockResolvedValue({
      type: 'success',
      data: { ...successUser, idToken: null },
    });

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: 'failed',
    });
  });

  it('normalises unexpected errors to failed', async () => {
    mockSignIn.mockRejectedValue(new Error('boom'));

    await expect(signInWithGoogle()).rejects.toBeInstanceOf(SocialAuthError);
    await expect(signInWithGoogle()).rejects.toMatchObject({ code: 'failed' });
  });
});
