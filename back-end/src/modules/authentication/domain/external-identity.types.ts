export type ExternalProvider = 'google' | 'apple';

/**
 * The identity derived from a cryptographically verified provider credential.
 * The `subject` is the provider's stable identifier for the user (Google `sub`
 * / Apple `sub`) and is the only piece of identity used for account resolution.
 * The `email` is informational only and is never used to resolve or link
 * accounts.
 */
export interface VerifiedExternalIdentity {
  provider: ExternalProvider;
  subject: string;
  email: string | null;
}
