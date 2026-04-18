import { PrismaService } from '../../prisma/prisma.service';
export declare class ProgressService {
    private prisma;
    constructor(prisma: PrismaService);
    updateLessonProgress(userId: string, lessonId: string, data: any): Promise<{
        success: boolean;
    }>;
    getLessonProgress(userId: string, lessonId: string): Promise<{
        progress: number;
        completed: boolean;
    }>;
    getCourseProgress(userId: string, courseId: string): Promise<{
        progress: number;
        completedLessons: number;
        totalLessons: number;
    }>;
    getModuleProgress(userId: string, moduleId: string): Promise<{
        progress: number;
    }>;
    markLessonComplete(userId: string, lessonId: string, timeSpent?: number): Promise<{
        success: boolean;
    }>;
    getUserProgressSummary(userId: string): Promise<{
        coursesInProgress: number;
        coursesCompleted: number;
    }>;
    resetCourseProgress(userId: string, courseId: string): Promise<{
        success: boolean;
    }>;
    getProgressAnalytics(courseId: string): Promise<{
        avgProgress: number;
        completionRate: number;
    }>;
}
