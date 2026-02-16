import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { AuthenticationService } from './authentication.service';
import * as UserMap from '../users/mappers/userMap';
import { UserDTO } from '../users/mappers/userMap';
import UsersRepo from '../users/domain/user.repository';
import { InvalidCredentialsError } from './authentication.errors';

export function configurePassport(
  authenticationService: AuthenticationService,
  usersRepo: UsersRepo,
) {
  passport.serializeUser((user: UserDTO, done) => {
    done(null, user.id); // store user ID in session
  });

  passport.deserializeUser(
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (id: string, done) => {
      try {
        const user = await usersRepo.getById(id);
        if (!user) {
          console.error('Failed deserializing user from db');
          done(null, false);
          return;
        }
        const userDto = UserMap.toDTO(user);
        done(null, userDto);
      } catch (err) {
        done(err, false);
      }
    },
  );

  // Login Flow vvvvv
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (email, password, done): Promise<any> => {
        try {
          const user = await authenticationService.validateUser(
            email,
            password,
          );
          if (!user) {
            throw new InvalidCredentialsError();
          }
          const userDto = UserMap.toDTO(user);
          done(null, userDto);
        } catch (err) {
          done(err);
        }
      },
    ),
  );

  return passport;
}
