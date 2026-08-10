export interface OAuthConfig {
  googleServerClientIds: string[];
  googleCertsUrl: string;
  googleCertsCooldownMs: number;
  appleClientIds: string[];
  appleJwksUrl: string;
  appleJwksCooldownMs: number;
}

function splitCsv(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function loadOAuthConfig(): OAuthConfig {
  return {
    googleServerClientIds: splitCsv(process.env.GOOGLE_SERVER_CLIENT_IDS),
    googleCertsUrl:
      process.env.GOOGLE_JWKS_URL ??
      'https://www.googleapis.com/oauth2/v1/certs',
    googleCertsCooldownMs: Number(
      process.env.GOOGLE_JWKS_COOLDOWN_MS ?? 30_000,
    ),
    appleClientIds: splitCsv(process.env.APPLE_CLIENT_IDS),
    appleJwksUrl:
      process.env.APPLE_JWKS_URL ?? 'https://appleid.apple.com/auth/keys',
    // How long signing keys are cached before refresh. Kept configurable so
    // tests can disable the cooldown and exercise key rotation deterministically.
    appleJwksCooldownMs: Number(process.env.APPLE_JWKS_COOLDOWN_MS ?? 30_000),
  };
}
