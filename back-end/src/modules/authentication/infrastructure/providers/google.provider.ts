import { Injectable } from '@nestjs/common';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { loadOAuthConfig } from '../../config/oauth.config';
import { OAuthCredentialError } from '../../authentication.errors';
import type { VerifiedExternalIdentity } from '../../domain/external-identity.types';

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

// Google ID tokens are short lived (~1 hour). Cap how far in the future the
// `exp` may be (2 hours) to reject forged long-lived tokens while accepting
// standard 1-hour tokens.
const MAX_GOOGLE_TOKEN_AGE_SECS = 2 * 60 * 60;

/**
 * Verifies Google ID tokens for backend authentication.
 *
 * Verification is delegated to `google-auth-library`, which independently:
 *  - validates the JWT signature against Google's published signing certs,
 *  - validates the issuer against Google's known issuers,
 *  - validates the audience against the configured server/web client ID(s),
 *  - validates `iat`/`exp` (including clock skew and max token age).
 *
 * Google's signing certs are fetched from Google's certs endpoint and cached
 * for a short cooldown; a token whose `kid` is unknown forces a refresh, so
 * Google's signing-key rotation is handled.
 *
 * The verified `sub` claim is the only identity used downstream; anything the
 * client supplied alongside the token is never trusted.
 */
@Injectable()
export class GoogleProvider {
  private readonly client: OAuth2Client;
  private readonly allowedAudiences: string[];
  private readonly certsUrl: string;
  private readonly cooldownMs: number;

  private cachedCerts: Record<string, string> | null = null;
  private lastFetch = 0;
  private fetchInFlight: Promise<Record<string, string>> | null = null;

  constructor() {
    const { googleServerClientIds, googleCertsUrl, googleCertsCooldownMs } =
      loadOAuthConfig();
    if (googleServerClientIds.length === 0) {
      throw new Error('env.GOOGLE_SERVER_CLIENT_IDS must be set');
    }
    this.allowedAudiences = googleServerClientIds;
    this.certsUrl = googleCertsUrl;
    this.cooldownMs = googleCertsCooldownMs;
    this.client = new OAuth2Client({
      clientId: googleServerClientIds[0],
      issuers: GOOGLE_ISSUERS,
    });
  }

  async verifyIdToken(idToken: string): Promise<VerifiedExternalIdentity> {
    let payload: TokenPayload | undefined;
    try {
      const certs = await this.getCertsForToken(idToken);
      const loginTicket = await this.client.verifySignedJwtWithCertsAsync(
        idToken,
        certs,
        this.allowedAudiences,
        GOOGLE_ISSUERS,
        MAX_GOOGLE_TOKEN_AGE_SECS,
      );
      payload = loginTicket.getPayload();
    } catch {
      // google-auth-library embeds the JWT in some error messages (e.g.
      // "Invalid token signature: <jwt>"). Never log or surface it.
      throw new OAuthCredentialError();
    }

    if (!payload?.sub) {
      throw new OAuthCredentialError();
    }

    return {
      provider: 'google',
      subject: payload.sub,
      email: payload.email ?? null,
    };
  }

  private async getCertsForToken(
    idToken: string,
  ): Promise<Record<string, string>> {
    const certs = await this.getCerts();

    const kid = this.extractKid(idToken);
    if (kid && certs[kid]) {
      return certs;
    }

    // Unknown kid: Google may have rotated signing keys. Refresh and retry once.
    this.cachedCerts = null;
    return this.getCerts();
  }

  private extractKid(idToken: string): string | null {
    const segment = idToken.split('.')[0];
    if (!segment) return null;
    try {
      const header = JSON.parse(
        Buffer.from(segment, 'base64url').toString('utf8'),
      ) as { kid?: string };
      return header.kid ?? null;
    } catch {
      return null;
    }
  }

  private async getCerts(): Promise<Record<string, string>> {
    if (this.cachedCerts && Date.now() - this.lastFetch < this.cooldownMs) {
      return this.cachedCerts;
    }
    if (this.fetchInFlight) {
      return this.fetchInFlight;
    }
    this.fetchInFlight = this.fetchAndBuildCerts().finally(() => {
      this.fetchInFlight = null;
    });
    return this.fetchInFlight;
  }

  private async fetchAndBuildCerts(): Promise<Record<string, string>> {
    const response = await fetch(this.certsUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Google signing certs: HTTP ${response.status}`,
      );
    }
    const data = (await response.json()) as Record<string, string>;

    this.cachedCerts = data;
    this.lastFetch = Date.now();
    return data;
  }
}
