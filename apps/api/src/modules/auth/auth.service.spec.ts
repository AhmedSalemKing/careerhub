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
    },
    userActivity: {
      create: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
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
  });

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
  });
});
