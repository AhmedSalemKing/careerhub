import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}
  async enrollUser(userId: string, courseId: string, paymentId?: string) { return { success: true, courseId, userId }; }
  async getEnrollment(userId: string, courseId: string) { return (this.prisma as any).enrollment.findFirst({ where: { userId, courseId } }); }
  async getUserEnrollments(userId: string, options: any) { return { data: [], total: 0 }; }
  async updateEnrollmentProgress(enrollmentId: string, progress: number) { return { success: true, progress }; }
  async completeEnrollment(enrollmentId: string) { return { success: true }; }
  async getEnrollmentDetails(userId: string, courseId: string, language?: string) { return { courseId, userId, progress: 0 }; }
  async getEnrollmentProgress(userId: string, courseId: string) { return { progress: 0, completedLessons: 0, totalLessons: 0 }; }
  async unenroll(userId: string, courseId: string) { return { success: true }; }
  async getAdminEnrollments(options: any) { return { data: [], total: 0 }; }
  async checkLessonCompletion(userId: string, lessonId: string, courseId: string) { return { success: true }; }
}

