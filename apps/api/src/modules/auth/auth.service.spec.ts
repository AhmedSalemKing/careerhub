import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    userActivity: {
      create: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret-32-chars-minimum-length!!';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret-32-chars!!';
      if (key === 'JWT_EXPIRATION') return '15m';
      if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
      return null;
    }),
  };

  const mockNotifications = {
    createNotification: jest.fn(),
  };

  const mockEmail = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('should throw UnauthorizedException on invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'wrong@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: await bcrypt.hash('correct', 10),
        role: 'USER',
        isActive: true,
        accountType: 'STUDENT',
        status: 'ACTIVE',
        profile: { firstName: 'Test', lastName: 'User', avatar: null, language: 'en' },
      });
      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on banned user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: await bcrypt.hash('pass', 10),
        role: 'USER',
        isActive: true,
        accountType: 'STUDENT',
        status: 'BANNED',
        profile: { firstName: 'Test', lastName: 'User', avatar: null, language: 'en' },
      });
      await expect(
        service.login({ email: 'test@test.com', password: 'pass' }),
      ).rejects.toThrow('Account is disabled');
    });

    it('should throw ForbiddenException on rejected user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: await bcrypt.hash('pass', 10),
        role: 'USER',
        isActive: true,
        accountType: 'INSTRUCTOR',
        status: 'REJECTED',
        profile: { firstName: 'Test', lastName: 'User', avatar: null, language: 'en' },
      });
      await expect(
        service.login({ email: 'test@test.com', password: 'pass' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject login when the account has no local password (Google OAuth)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'oauth@test.com',
        password: null,
        provider: 'google',
        role: 'USER',
        isActive: true,
        accountType: 'STUDENT',
        status: 'ACTIVE',
        profile: { firstName: 'Test', lastName: 'User', avatar: null, language: 'en' },
      });
      await expect(
        service.login({ email: 'oauth@test.com', password: 'whatever' }),
      ).rejects.toThrow('Use Google login for this account');
    });

    it('should authenticate a freshly registered user with the same password', async () => {
      const stored = await createRegisteredUser('fresh@test.com', 'Pass123!');

      mockPrisma.user.findUnique.mockResolvedValue({
        ...stored.user,
        password: stored.hashedPassword,
        profile: { firstName: 'Fresh', lastName: 'User', avatar: null, language: 'en' },
      });

      const result = await service.login({ email: 'fresh@test.com', password: 'Pass123!' });
      expect(result.accessToken).toBeTruthy();
      expect(result.user).toBeTruthy();
      expect((result.user as any).password).toBeUndefined();
    });
  });

  // Registers a user and returns what actually got persisted
  async function createRegisteredUser(email: string, password: string) {
    let hashedPassword = '';

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockPrisma.transaction.mockImplementation(async (fn: any) =>
      fn({
        user: {
          create: jest.fn(async ({ data }: any) => {
            hashedPassword = data.password;
            return { id: 'u-1', role: 'USER', isActive: true, ...data };
          }),
        },
        userProfile: {
          create: jest.fn().mockResolvedValue({
            userId: 'u-1',
            firstName: 'Fresh',
            lastName: 'User',
            language: 'en',
            avatar: null,
          }),
        },
      }),
    );
    mockPrisma.session.deleteMany.mockResolvedValue({});
    mockPrisma.session.create.mockResolvedValue({});

    const result = await service.register({
      email,
      password,
      firstName: 'Fresh',
      lastName: 'User',
      accountType: 'STUDENT',
    });

    return { hashedPassword, user: result.user, accessToken: result.accessToken };
  }

  describe('register', () => {
    it('should throw BadRequestException on duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@test.com' });
      await expect(
        service.register({
          email: 'existing@test.com',
          password: 'Pass123!',
          firstName: 'Test',
          lastName: 'User',
          accountType: 'STUDENT',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash the password with bcrypt before saving it', async () => {
      const stored = await createRegisteredUser('hashed@test.com', 'Pass123!');

      expect(stored.hashedPassword).not.toBe('Pass123!');
      expect(stored.hashedPassword).toMatch(/^\$2[aby]\$/);
      await expect(bcrypt.compare('Pass123!', stored.hashedPassword)).resolves.toBe(true);
      expect(stored.accessToken).toBeTruthy();
      expect((stored.user as any).password).toBeUndefined();
    });
  });
});
