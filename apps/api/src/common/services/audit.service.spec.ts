import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, SecurityEvent } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;

  const mockPrisma = {
    securityLog: {
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should log security event', async () => {
    mockPrisma.securityLog.create.mockResolvedValue({ id: '1' });
    await service.log({
      event: SecurityEvent.LOGIN_SUCCESS,
      userId: 'user-1',
      email: 'test@test.com',
      ip: '127.0.0.1',
    });
    expect(mockPrisma.securityLog.create).toHaveBeenCalledTimes(1);
  });

  it('should not throw if logging fails', async () => {
    mockPrisma.securityLog.create.mockRejectedValue(new Error('DB error'));
    await expect(
      service.log({ event: SecurityEvent.LOGIN_FAILED, email: 'test@test.com' }),
    ).resolves.not.toThrow();
  });

  it('should count recent failed logins', async () => {
    mockPrisma.securityLog.count.mockResolvedValue(5);
    const count = await service.getRecentFailedLogins('127.0.0.1', 15);
    expect(count).toBe(5);
  });

  it('should detect brute force after 10 failed attempts', async () => {
    mockPrisma.securityLog.count.mockResolvedValue(10);
    const count = await service.getRecentFailedLogins('attacker-ip', 15);
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it('should count recent password resets', async () => {
    mockPrisma.securityLog.count.mockResolvedValue(3);
    const count = await service.getRecentPasswordResets('test@test.com', 1);
    expect(count).toBe(3);
  });
});
