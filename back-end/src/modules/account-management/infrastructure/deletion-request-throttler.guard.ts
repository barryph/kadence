import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'node:crypto';
import {
  DELETION_ADDRESS_THROTTLER,
  DELETION_REQUEST_ADDRESS_LIMIT,
  DELETION_REQUEST_ADDRESS_TTL_MS,
} from './deletion.constants';

/**
 * Derives the throttle key for the public deletion-request endpoint.
 *
 * The per-client limit (IP) is the default `ThrottlerGuard` behaviour and is
 * left alone. What that cannot do is stop a single client asking for a link to
 * *one address* over and over, which is the spam vector that matters here - so
 * the submitted address is folded into the key, sharded by client, for the
 * address-scoped throttler only.
 *
 * The address is hashed rather than used raw: the rate-limit store is not a
 * place to accumulate a list of real email addresses. A missing or malformed
 * body falls back to the client key, so the endpoint still throttles something
 * when it cannot identify an address.
 */
export function deletionThrottleTracker(
  clientKey: string,
  body: unknown,
): string {
  const email = extractEmail(body);
  if (!email) {
    return clientKey;
  }

  const addressKey = createHash('sha256')
    .update(email)
    .digest('hex')
    .slice(0, 32);
  return `${clientKey}:${addressKey}`;
}

function extractEmail(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const email = (body as { email?: unknown }).email;
  if (typeof email !== 'string') {
    return null;
  }
  const normalised = email.trim().toLowerCase();
  return normalised === '' ? null : normalised;
}

/**
 * Applies {@link deletionThrottleTracker} to requests hitting the
 * deletion-request endpoint. Attached to that one route; the global
 * `ThrottlerGuard` continues to apply the plain per-client limit everywhere.
 */
@Injectable()
export class DeletionRequestThrottlerGuard extends ThrottlerGuard {
  /**
   * This guard owns the address dimension and nothing else.
   *
   * The named throttler is deliberately not listed in `ThrottlerModule`:
   * `ThrottlerGuard` applies every globally registered throttler to every
   * route, so registering it there would cap the whole API at the address
   * limit. Replacing `throttlers` with just the address entry keeps the global
   * `default` (per IP) out of this guard, so the two dimensions stay distinct
   * instead of the address budget doubling as a per-IP budget.
   */
  async onModuleInit(): Promise<void> {
    await super.onModuleInit();
    this.throttlers = [
      {
        name: DELETION_ADDRESS_THROTTLER,
        ttl: DELETION_REQUEST_ADDRESS_TTL_MS,
        limit: DELETION_REQUEST_ADDRESS_LIMIT,
      },
    ];
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const clientKey = await super.getTracker(req);
    return deletionThrottleTracker(clientKey, req.body);
  }
}
