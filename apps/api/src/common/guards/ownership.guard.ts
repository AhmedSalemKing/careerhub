import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get resource type and ID from the decorator or route parameters
    const resourceType = this.reflector.get<string>('resourceType', context.getHandler());
    const resourceId = request.params.id || request.params.courseId || request.params.lessonId;

    if (!resourceType || !resourceId) {
      return true; // Skip ownership check if resource type or ID is not specified
    }

    // Admin users can access all resources
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check ownership based on resource type
    const isOwner = await this.checkOwnership(user.id, resourceType, resourceId);
    
    if (!isOwner) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }

  private async checkOwnership(userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    switch (resourceType) {
      case 'course':
        return this.checkCourseOwnership(userId, resourceId);
      case 'lesson':
        return this.checkLessonOwnership(userId, resourceId);
      case 'enrollment':
        return this.checkEnrollmentOwnership(userId, resourceId);
      case 'certificate':
        return this.checkCertificateOwnership(userId, resourceId);
      case 'payment':
        return this.checkPaymentOwnership(userId, resourceId);
      case 'notification':
        return this.checkNotificationOwnership(userId, resourceId);
      case 'file':
        return this.checkFileOwnership(userId, resourceId);
      case 'coachingSession':
        return this.checkCoachingSessionOwnership(userId, resourceId);
      default:
        return false;
    }
  }

  private async checkCourseOwnership(userId: string, courseId: string): Promise<boolean> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    return true;
  }

  private async checkLessonOwnership(userId: string, lessonId: string): Promise<boolean> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        module: {
          select: {
            course: {
              select: { id: true },
            },
          },
        },
      },
    });

    return true;
  }

  private async checkEnrollmentOwnership(userId: string, enrollmentId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { userId: true },
    });

    return enrollment?.userId === userId;
  }

  private async checkCertificateOwnership(userId: string, certificateId: string): Promise<boolean> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { userId: true },
    });

    return certificate?.userId === userId;
  }

  private async checkPaymentOwnership(userId: string, paymentId: string): Promise<boolean> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { userId: true },
    });

    return payment?.userId === userId;
  }

  private async checkNotificationOwnership(userId: string, notificationId: string): Promise<boolean> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    return notification?.userId === userId;
  }

  private async checkFileOwnership(userId: string, fileId: string): Promise<boolean> {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
      select: { userId: true },
    });

    return file?.userId === userId;
  }

  private async checkCoachingSessionOwnership(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.prisma.coachingSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, coachId: true },
    });

    return session?.userId === userId || session?.coachId === userId;
  }
}


