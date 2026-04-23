import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private prisma: PrismaService) {}

  async submitVerification(userId: string, data: {
    idFrontUrl: string;
    idBackUrl: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!['INSTRUCTOR', 'CONSULTANT'].includes(user.accountType)) {
      throw new ForbiddenException('التوثيق متاح فقط للمحاضرين والمستشارين');
    }

    if (user.isVerified) {
      throw new BadRequestException('حسابك موثق بالفعل');
    }

    if (user.idVerificationStatus === 'PENDING') {
      throw new BadRequestException('لديك طلب توثيق قيد المراجعة');
    }

    if (user.idVerificationStatus === 'REJECTED') {
      throw new BadRequestException('طلبك السابق مرفوض. يمكنك إعادة التقديم');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        idFrontUrl: data.idFrontUrl,
        idBackUrl: data.idBackUrl,
        idVerificationStatus: 'PENDING',
      },
    });

    this.logger.log(`[Verification] Submitted by user: ${user.email}`);

    return { success: true, data: { status: 'PENDING' } };
  }

  async getVerificationStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        idVerificationStatus: true,
        isVerified: true,
        idVerifiedAt: true,
        idRejectedReason: true,
        idFrontUrl: true,
        idBackUrl: true,
      },
    });

    return { success: true, data: user };
  }

  async getPendingVerifications() {
    const users = await this.prisma.user.findMany({
      where: { idVerificationStatus: 'PENDING' },
      select: {
        id: true,
        email: true,
        accountType: true,
        idFrontUrl: true,
        idBackUrl: true,
        createdAt: true,
        profile: { select: { firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return users;
  }

  async approveVerification(userId: string, adminId?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        idVerificationStatus: 'VERIFIED',
        isVerified: true,
        idVerifiedAt: new Date(),
        idRejectedReason: null,
      },
      include: { profile: true },
    });

    this.logger.log(`[Verification] Approved for user: ${user.email} by admin: ${adminId}`);

    return { success: true, data: user };
  }

  async rejectVerification(userId: string, reason: string, adminId?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        idVerificationStatus: 'REJECTED',
        isVerified: false,
        idRejectedReason: reason || 'الوثائق المقدمة غير واضحة أو غير مطابقة',
      },
      include: { profile: true },
    });

    this.logger.log(`[Verification] Rejected for user: ${user.email} by admin: ${adminId}`);

    return { success: true, data: user };
  }
}