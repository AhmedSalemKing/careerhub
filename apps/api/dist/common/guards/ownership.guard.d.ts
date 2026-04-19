import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
export declare class OwnershipGuard implements CanActivate {
    private reflector;
    private prisma;
    constructor(reflector: Reflector, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private checkOwnership;
    private checkCourseOwnership;
    private checkLessonOwnership;
    private checkEnrollmentOwnership;
    private checkCertificateOwnership;
    private checkPaymentOwnership;
    private checkNotificationOwnership;
    private checkFileOwnership;
    private checkCoachingSessionOwnership;
}
