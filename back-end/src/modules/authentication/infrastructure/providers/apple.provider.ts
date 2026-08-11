import { Injectable } from '@nestjs/common';
import {
  createHash,
  createPublicKey,
  type JsonWebKey,
  type KeyObject,
} from 'node:crypto';
import jwt from 'jsonwebtoken';
import { loadOAuthConfig } from '../../config/oauth.config';
import { OAuthCredentialError } from '../../authentication.errors';
import type { VerifiedExternalIdentity } from '../../domain/external-identity.types';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_TOKEN_ALGORITHM = 'RS256';

interface AppleJwk {
  kty: string;
  kid: string;
  n?: string;
  e?: string;
  [key: string]: unknown;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/**
 * Verifies Apple Sign in with Apple identity tokens for backend authentication.
 *
 * The token is verified against Apple's published signing keys:
 *  - JWT signature (RS256) using a public key derived from Apple's JWKS,
 *  - issuer (`https://appleid.apple.com`),
 *  - audience (one of the configured client IDs / bundle identifiers),
 *  - expiry (jsonwebtoken validates `exp`/`iat`),
 *  - nonce (Apple stores the SHA-256 hash of the raw nonce in the token's
 *    `nonce` claim, so we compare against that hash).
 *
 * Apple's signing keys are fetched from Apple's JWKS endpoint and cached for a
 * short cooldown; a token whose `kid` is unknown forces a refresh, so Apple's
 * key rotation is handled.
 *
 * The verified `sub` claim is the only identity used downstream. The `user`
 * object returned by the client's native SDK is never trusted.
 */
@Injectable()
export class AppleProvider {
  private readonly allowedAudiences: string[];
  private readonly jwksUrl: string;
  private readonly cooldownMs: number;

  private cachedKeys: Map<string, KeyObject> | null = null;
  private lastFetch = 0;
  private fetchInFlight: Promise<Map<string, KeyObject>> | null = null;

  constructor() {
    const { appleClientIds, appleJwksUrl, appleJwksCooldownMs } =
      loadOAuthConfig();
    if (appleClientIds.length === 0) {
      throw new Error('env.APPLE_CLIENT_IDS must be set');
    }
    this.allowedAudiences = appleClientIds;
    this.jwksUrl = appleJwksUrl;
    this.cooldownMs = appleJwksCooldownMs;
  }

  async verifyIdentityToken(
    idToken: string,
    rawNonce?: string,
  ): Promise<VerifiedExternalIdentity> {
    // Sign in with Apple always uses a nonce in this application. Fail closed
    // rather than skip nonce validation if one was not supplied.
    if (!rawNonce) {
      console.error('Error: No raw nonce');
      throw new OAuthCredentialError();
    }

    let payload: jwt.JwtPayload;
    try {
      const key = await this.getKeyForToken(idToken);
      payload = jwt.verify(idToken, key, {
        algorithms: [APPLE_TOKEN_ALGORITHM],
        issuer: APPLE_ISSUER,
        audience: this.allowedAudiences as [string, ...string[]],
        nonce: sha256(rawNonce),
      }) as jwt.JwtPayload;
    } catch {
      // Never log or surface the raw error: it can include token contents.
      console.error('Error: While verifying apple identify token');
      throw new OAuthCredentialError();
    }

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      console.error('Error: Apple token is missing sub');
      throw new OAuthCredentialError();
    }

    const email = typeof payload.email === 'string' ? payload.email : null;

    return {
      provider: 'apple',
      subject: payload.sub,
      email,
    };
  }

  private async getKeyForToken(idToken: string): Promise<KeyObject> {
    const decoded = jwt.decode(idToken, { complete: true }) as {
      header: { kid?: string };
    } | null;
    const kid = decoded?.header?.kid;
    if (!kid) {
      throw new Error('No kid in token header');
    }

    const keys = await this.getKeys();
    const key = keys.get(kid);
    if (key) {
      return key;
    }

    // Unknown kid: Apple may have rotated keys. Refresh and retry once.
    this.cachedKeys = null;
    const refreshed = await this.getKeys();
    const refetched = refreshed.get(kid);
    if (!refetched) {
      throw new Error('No matching Apple signing key');
    }
    return refetched;
  }

  private async getKeys(): Promise<Map<string, KeyObject>> {
    if (this.cachedKeys && Date.now() - this.lastFetch < this.cooldownMs) {
      return this.cachedKeys;
    }
    if (this.fetchInFlight) {
      return this.fetchInFlight;
    }
    this.fetchInFlight = this.fetchAndBuildKeys().finally(() => {
      this.fetchInFlight = null;
    });
    return this.fetchInFlight;
  }

  private async fetchAndBuildKeys(): Promise<Map<string, KeyObject>> {
    const response = await fetch(this.jwksUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Apple JWKS: HTTP ${response.status}`);
    }
    const data = (await response.json()) as { keys: AppleJwk[] };

    const keys = new Map<string, KeyObject>();
    for (const jwk of data.keys) {
      if (jwk.kty !== 'RSA' || !jwk.n || !jwk.e) {
        continue;
      }
      keys.set(
        jwk.kid,
        createPublicKey({ key: jwk as JsonWebKey, format: 'jwk' }),
      );
    }

    this.cachedKeys = keys;
    this.lastFetch = Date.now();
    return keys;
  }
}
