import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import { ConnectSessionKnexStore } from 'connect-session-knex';
import { configurePassport } from './modules/authentication/passport';
import { AuthenticationService } from './modules/authentication/services/authentication.service';
import UsersRepo from './modules/users/repos/user.repository';
import { AllExceptionsFilter } from './ExceptionFilter';
import { KnexService } from './shared/knex/knex.service';

// Log unhandled promise rejections and uncaught exceptions (e.g. errors in Passport callbacks that never throw into Nest)
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err?.stack ?? err);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  // Enable validation of request bodies
  // https://docs.nestjs.com/techniques/validation#auto-validation
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Habit')
    .setDescription('The habits API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // TODO: Make env variable
  const corsOrigins = ['*'];
  app.use(
    cors({
      // Allow cors origins to be a wildcard (*) or a list or origins
      origin: (origin, cb) =>
        // @ts-expect-error origin could be undefined
        cb(null, corsOrigins.includes('*') || corsOrigins.includes(origin)),
      credentials: true,
    }),
  );

  // Passport setup
  const authenticationService = app.get(AuthenticationService);
  const usersRepo = app.get(UsersRepo);
  configurePassport(authenticationService, usersRepo);
  const knexService = app.get(KnexService);
  app.use(
    session({
      // - there is an any type somewhere in here

      store: new ConnectSessionKnexStore({
        knex: knexService.connection,
        tableName: 'user_sessions',
      }),
      secret: 'my-super-secret-key', // TODO: Update this before release
      resave: false,
      saveUninitialized: false,
      // TODO: Configure cookies secure for production
      cookie: {
        // Note: Chrome doesn't allow sameSite='none' without secure
        sameSite: false,
        // sameSite: 'lax',
        secure: false,
        maxAge: 1000 * 60 * 60 * 7,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
