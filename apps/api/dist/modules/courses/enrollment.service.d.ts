import { PrismaService } from '../../prisma/prisma.service';
export declare class EnrollmentService {
    private prisma;
    constructor(prisma: PrismaService);
    enrollUser(userId: string, courseId: string, paymentId?: string): Promise<{
        success: boolean;
        courseId: string;
        userId: string;
    }>;
    getEnrollment(userId: string, courseId: string): Promise<{
        id: string;
        courseId: string;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        progress: number;
        completedLessons: number;
        totalLessons: number;
        enrolledAt: Date;
        completedAt: Date;
    }>;
    getUserEnrollments(userId: string, options: any): Promise<{
        data: any[];
        total: number;
    }>;
    updateEnrollmentProgress(enrollmentId: string, progress: number): Promise<{
        success: boolean;
        progress: number;
    }>;
    completeEnrollment(enrollmentId: string): Promise<{
        success: boolean;
    }>;
    getEnrollmentDetails(userId: string, courseId: string, language?: string): Promise<{
        courseId: string;
        userId: string;
        progress: number;
    }>;
    getEnrollmentProgress(userId: string, courseId: string): Promise<{
        progress: number;
        completedLessons: number;
        totalLessons: number;
    }>;
    unenroll(userId: string, courseId: string): Promise<{
        success: boolean;
    }>;
    getAdminEnrollments(options: any): Promise<{
        data: any[];
        total: number;
    }>;
    checkLessonCompletion(userId: string, lessonId: string, courseId: string): Promise<{
        success: boolean;
    }>;
}
