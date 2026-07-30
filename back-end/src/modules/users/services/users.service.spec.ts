import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import UsersRepo from '../repos/user.repository';
import User from '../domain/user.entity';
import UserEmail from '../domain/value-objects/UserEmail';
import UserPassword from '../domain/value-objects/UserPassword';
import {
  EmailTakenError,
  PasswordsDontMatchError,
} from '../domain/user.errors';
import { InvalidResetTokenError } from '../../authentication/authentication.errors';
import { hashPasswordResetToken } from '../../authentication/utils/password-reset-token';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: jest.Mocked<UsersRepo>;

  beforeEach(async () => {
    usersRepo = {
      exists: jest.fn(),
      getById: jest.fn(),
      getByEmail: jest.fn(),
      create: jest.fn(),
      setPasswordResetToken: jest.fn(),
      findPasswordResetByToken: jest.fn(),
      updatePassword: jest.fn(),
      clearUserSessions: jest.fn(),
    } as unknown as jest.Mocked<UsersRepo>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepo, useValue: usersRepo }],
    }).compile();

    service = module.get(UsersService);
  });

  it('rejects registration when passwords do not match', async () => {
    await expect(
      service.create({
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'different123',
      }),
    ).rejects.toThrow(PasswordsDontMatchError);
  });

  it('rejects registration when email is taken', async () => {
    usersRepo.exists.mockResolvedValue(true);

    await expect(
      service.create({
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      }),
    ).rejects.toThrow(EmailTakenError);
  });

  it('creates a user when email is available and passwords match', async () => {
    usersRepo.exists.mockResolvedValue(false);
    const createdUser = User.reconstitute({
      id: '1',
      email: UserEmail.create('test@example.com'),
      password: UserPassword.create('password123'),
    });
    usersRepo.create.mockResolvedValue(createdUser);

    const result = await service.create({
      email: 'test@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
    });

    expect(result.email).toBe('test@example.com');
    expect(result.id).toBe('1');
  });

  it('silently returns null when initiating reset for unknown email', async () => {
    usersRepo.getByEmail.mockResolvedValue(null);

    const result = await service.initiatePasswordReset('unknown@example.com');
    expect(result).toBeNull();
    expect(usersRepo.setPasswordResetToken).not.toHaveBeenCalled();
  });

  it('stores reset token when user exists', async () => {
    const user = User.reconstitute({
      id: '1',
      email: UserEmail.create('test@example.com'),
      password: UserPassword.create('password123'),
    });
    usersRepo.getByEmail.mockResolvedValue(user);

    const result = await service.initiatePasswordReset('test@example.com');

    expect(result).toEqual({
      recipientEmail: 'test@example.com',
      resetToken: expect.any(String),
    });
    expect(usersRepo.setPasswordResetToken).toHaveBeenCalledWith(
      '1',
      expect.any(String),
      expect.any(Date),
    );
  });

  it('rejects reset with invalid token', async () => {
    usersRepo.findPasswordResetByToken.mockResolvedValue(null);

    await expect(
      service.resetPassword('invalid-token', 'newpassword123'),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it('rejects reset with expired token', async () => {
    usersRepo.findPasswordResetByToken.mockResolvedValue({
      userId: '1',
      passwordResetExpires: new Date(Date.now() - 1000),
    });

    await expect(
      service.resetPassword('expired-token', 'newpassword123'),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it('updates password and clears sessions with valid token', async () => {
    const token = 'valid-token';
    usersRepo.findPasswordResetByToken.mockResolvedValue({
      userId: '1',
      passwordResetExpires: new Date(Date.now() + 60_000),
    });

    await service.resetPassword(token, 'newpassword123');

    expect(usersRepo.updatePassword).toHaveBeenCalledWith(
      '1',
      expect.any(String),
    );
    expect(usersRepo.clearUserSessions).toHaveBeenCalledWith('1');
    expect(usersRepo.findPasswordResetByToken).toHaveBeenCalledWith(
      hashPasswordResetToken(token),
    );
  });
});
