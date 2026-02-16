import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { InvalidCredentialsError } from './authentication.errors';
import CreateUserDTO from '../authentication/dtos/createUser.dto';
import { UserDTO } from '../users/mappers/userMap';
import User from '../users/domain/user.entity';

@Injectable()
export class AuthenticationService {
  constructor(private usersService: UsersService) { }

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.getByEmail(email);
    console.log('got by email', user);
    if (!user) {
      console.log('not email');
      throw new InvalidCredentialsError();
    }

    console.log(pass);
    const doPasswordsMatch = await user.password.comparePasswords(pass);
    if (!doPasswordsMatch) {
      throw new InvalidCredentialsError();
    }

    return user;
  }

  async register(createUserDto: CreateUserDTO): Promise<UserDTO> {
    const user = await this.usersService.create(createUserDto);
    return user;
  }
}
