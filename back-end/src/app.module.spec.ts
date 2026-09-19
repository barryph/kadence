import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerStorageService,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { GLOBAL_THROTTLE_LIMIT, GLOBAL_THROTTLE_TTL_MS } from './app.module';
import {
  AccountController,
  AccountDeletionController,
} from './modules/account-management/presentation/account.controller';
import { AuthenticationController } from './modules/authentication/authentication.controller';
import {
  DELETION_REQUEST_ADDRESS_LIMIT,
  DELETION_REQUEST_CLIENT_LIMIT,
} from './modules/account-management/infrastructure/deletion.constants';
import { DeletionRequestThrottlerGuard } from './modules/account-management/infrastructure/deletion-request-throttler.guard';

/**
 * Rate-limit wiring no other suite sees: `ThrottlerModule` skips throttling
 * under `NODE_ENV=test`, so e2e specs never reach these budgets.
 *
 * Both guards read the real `@Throttle` metadata off the real controller
 * handlers, so the limits asserted here are the production ones. The guards
 * are built by hand rather than by booting `AppModule` (which needs a database),
 * mirroring how `app.module.ts` wires them.
 */
// The in-memory storage schedules one timeout per hit; shut each down so
// nothing outlives the test.
const storages: ThrottlerStorageService[] = [];
afterEach(() => {
  while (storages.length) {
    storages.pop()?.onApplicationShutdown();
  }
});

async function createGuards(): Promise<{
  global: ThrottlerGuard;
  deletion: DeletionRequestThrottlerGuard;
}> {
  const options: ThrottlerModuleOptions = {
    throttlers: [{ ttl: GLOBAL_THROTTLE_TTL_MS, limit: GLOBAL_THROTTLE_LIMIT }],
  };
  const storage = new ThrottlerStorageService();
  storages.push(storage);
  const reflector = new Reflector();
  const global = new ThrottlerGuard(options, storage, reflector);
  const deletion = new DeletionRequestThrottlerGuard(
    options,
    storage,
    reflector,
  );
  await global.onModuleInit();
  await deletion.onModuleInit();
  return { global, deletion };
}

type FakeResponse = {
  headers: Record<string, string>;
  header: (name: string, value: unknown) => FakeResponse;
};

function makeResponse(): FakeResponse {
  const res: FakeResponse = {
    headers: {},
    header(name, value) {
      res.headers[name] = String(value);
      return res;
    },
  };
  return res;
}

function contextFor(
  controller: object,
  handler: (...args: never[]) => unknown,
  email = 'a@b.com',
): { context: ExecutionContext; res: FakeResponse } {
  const res = makeResponse();
  const req = { ip: '203.0.113.7', headers: {}, body: { email } };
  const context = {
    getClass: () => controller,
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
  return { context, res };
}

function deletionRequestContext(email: string) {
  return contextFor(
    AccountDeletionController,
    AccountDeletionController.prototype.requestDeletion,
    email,
  );
}

async function drive(
  guard: ThrottlerGuard,
  context: ExecutionContext,
  times: number,
): Promise<void> {
  for (let i = 0; i < times; i++) {
    await expect(guard.canActivate(context)).resolves.toBe(true);
  }
}

describe('the deletion request endpoint limits two dimensions', () => {
  it('limits one client (IP) independently of the address', async () => {
    const { global } = await createGuards();

    // Distinct addresses: the per-address budget never binds, so the per-client
    // budget is what stops the sixth request.
    for (let i = 0; i < DELETION_REQUEST_CLIENT_LIMIT; i++) {
      const { context } = deletionRequestContext(`user${i}@example.com`);
      await expect(global.canActivate(context)).resolves.toBe(true);
    }

    const { context } = deletionRequestContext('user-extra@example.com');
    await expect(global.canActivate(context)).rejects.toBeInstanceOf(
      ThrottlerException,
    );
  });

  it('limits one address below the per-client budget', async () => {
    const { deletion } = await createGuards();

    // Same address. The per-client budget is 5, so without the address limit
    // the fourth request would pass.
    for (let i = 0; i < DELETION_REQUEST_ADDRESS_LIMIT; i++) {
      const { context } = deletionRequestContext('victim@example.com');
      await expect(deletion.canActivate(context)).resolves.toBe(true);
    }

    const { context } = deletionRequestContext('victim@example.com');
    await expect(deletion.canActivate(context)).rejects.toBeInstanceOf(
      ThrottlerException,
    );
  });

  it('does not re-apply the per-client budget inside the address guard', async () => {
    const { deletion } = await createGuards();

    // Distinct addresses: every address counter is fresh, so the address guard
    // lets more through than the per-client budget would. If it still carried
    // the `default` throttler this would throw on the sixth request.
    for (let i = 0; i < DELETION_REQUEST_CLIENT_LIMIT + 1; i++) {
      const { context } = deletionRequestContext(`user${i}@example.com`);
      await expect(deletion.canActivate(context)).resolves.toBe(true);
    }
  });
});

describe('account deletion keeps its very low limit', () => {
  it('rejects the fourth authenticated deletion in a minute', async () => {
    const { global } = await createGuards();
    const { context } = contextFor(
      AccountController,
      AccountController.prototype.deleteAccount,
    );

    await drive(global, context, 3);
    await expect(global.canActivate(context)).rejects.toBeInstanceOf(
      ThrottlerException,
    );
  });
});

describe('existing endpoint-specific throttles are preserved', () => {
  it('keeps login at its own limit', async () => {
    const { global } = await createGuards();
    const { context, res } = contextFor(
      AuthenticationController,
      AuthenticationController.prototype.login,
    );

    await drive(global, context, 5);

    expect(res.headers['X-RateLimit-Limit']).toBe('5');
    await expect(global.canActivate(context)).rejects.toBeInstanceOf(
      ThrottlerException,
    );
  });
});
