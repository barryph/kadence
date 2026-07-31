import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './ExceptionFilter';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { ConnectSessionKnexStore } from 'connect-session-knex';
import { configurePassport } from './modules/authentication/passport';
import { AuthenticationService } from './modules/authentication/services/authentication.service';
import UsersRepo from './modules/users/repos/user.repository';
import { KnexService } from './shared/knex/knex.service';

export function configureApp(app: INestApplication): void {
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const corsOrigins = ['*'];
  app.use(
    cors({
      origin: (origin, cb) =>
        // @ts-expect-error origin could be undefined
        cb(null, corsOrigins.includes('*') || corsOrigins.includes(origin)),
      credentials: true,
    }),
  );

  const authenticationService = app.get(AuthenticationService);
  const usersRepo = app.get(UsersRepo);
  configurePassport(authenticationService, usersRepo);

  if (!process.env.SESSION_SECRET) {
    throw new Error('env.SESSION_SECRET must be set');
  }
  const knexService = app.get(KnexService);
  app.use(
    session({
      store: new ConnectSessionKnexStore({
        knex: knexService.connection,
        tableName: 'user_sessions',
        createTable: true,
        // Disable periodic cleanup in tests to avoid open handles after Jest exits
        ...(process.env.NODE_ENV === 'test' && { cleanupInterval: 0 }),
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 7,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
}
