import { IsEmail, IsNotEmpty } from 'class-validator';
import User from '../domain/user.entity';
import UserEmail from '../domain/value-objects/UserEmail';
import UserPassword from '../domain/value-objects/UserPassword';

export interface IUserPersistence {
  id?: string; // Optional if first time saving
  email: string;
  password: string | null;
  created_at?: string;
  updated_at?: string;
}

export class UserDTO {
  @IsNotEmpty()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export function toDTO(user: User): UserDTO {
  user.ensurePersisted();
  return {
    id: user.id,
    email: user.email.value,
  };
}

export async function toPersistence(user: User): Promise<IUserPersistence> {
  const hashedPassword = user.password
    ? await user.password.hashPassword()
    : null;
  return {
    ...(user.isPersisted() && { id: user.id }),
    email: user.email.value,
    password: hashedPassword,
  };
}

export function persistenceToDomain(user: IUserPersistence) {
  const email = UserEmail.create(user.email);
  const password = user.password ? UserPassword.create(user.password) : null;
  const domainUser = User.reconstitute({
    id: user.id,
    email,
    password,
  });
  return domainUser;
}
