import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './shared/knex/database.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { AccountManagementModule } from './modules/account-management/account-management.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ActivityGoalsModule } from './modules/activity-goals/activityGoals.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SessionLifecycleGuard } from './modules/authentication/session/session-lifecycle.guard';

const isTestMode = process.env.NODE_ENV === 'test';

/** The one global rate-limit policy: 200 requests/minute per client. */
export const GLOBAL_THROTTLE_TTL_MS = 60_000;
export const GLOBAL_THROTTLE_LIMIT = 200;

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthenticationModule,
    AccountManagementModule,
    ActivitiesModule,
    CategoriesModule,
    ActivityGoalsModule,
    // One global policy: 200 req/min per client. Endpoints that need a tighter
    // cap (auth, account deletion) override it inline with `@Throttle`. Nothing
    // is registered by name: `ThrottlerGuard` applies every registered
    // throttler to every route, so a named one would leak onto the whole API.
    ThrottlerModule.forRoot({
      // Disables throttling in test mode. Without this, e2e specs share one
      // rate-limit budget and fail on request count rather than behaviour.
      skipIf: () => isTestMode,
      throttlers: [
        {
          // Default, per-client (IP) limit applied globally by ThrottlerGuard.
          ttl: GLOBAL_THROTTLE_TTL_MS,
          limit: GLOBAL_THROTTLE_LIMIT,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Applies rolling session renewal / expiry to every route, including
    // public ones (a sign-in attempt carrying an expired cookie must still be
    // able to succeed). Registered in every environment: unlike rate limits,
    // this is part of the authentication model. `useExisting` keeps the single
    // instance the authentication module provides.
    {
      provide: APP_GUARD,
      useExisting: SessionLifecycleGuard,
    },
    // Disable rate limits in test mode
    ...(isTestMode
      ? []
      : [
          // Applies the throttle globally by binding the ThrottlerGuard Guard to every endpoint
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]),
  ],
})
export class AppModule {}
