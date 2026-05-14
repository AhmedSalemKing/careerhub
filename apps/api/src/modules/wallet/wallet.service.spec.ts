import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('payWithWallet', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      await expect(
        service.payWithWallet('user-1', 'course-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on insufficient balance', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        price: 100,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        walletBalance: 10,
      });
      await expect(
        service.payWithWallet('user-1', 'course-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upsert enrollment for free courses', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        price: 0,
      });
      mockPrisma.enrollment.upsert.mockResolvedValue({ userId: 'user-1', courseId: 'course-1' });

      const result = await service.payWithWallet('user-1', 'course-1');
      expect(result.success).toBe(true);
      expect(mockPrisma.enrollment.upsert).toHaveBeenCalledTimes(1);
    });

    it('should throw if already enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        price: 50,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        walletBalance: 100,
      });
      mockPrisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        userId: 'user-1',
        courseId: 'course-1',
      });

      await expect(
        service.payWithWallet('user-1', 'course-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
