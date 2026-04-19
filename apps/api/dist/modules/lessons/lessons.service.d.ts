import { PrismaService } from '../../prisma/prisma.service';
export declare class LessonsService {
    private prisma;
    constructor(prisma: PrismaService);
    getLessons(courseId: string, language?: string): Promise<{
        data: any[];
        total: number;
    }>;
    getLesson(id: string, language?: string): Promise<{
        id: string;
        title: string;
    }>;
    getLessonById(id: string, language?: string): Promise<{
        id: string;
        title: string;
    }>;
    getLessonContent(userId: string, lessonId: string, language?: string): Promise<{
        id: string;
        content: string;
    }>;
    getLessonVideo(userId: string, lessonId: string): Promise<{
        id: string;
        videoUrl: string;
    }>;
    updateLessonProgress(userId: string, lessonId: string, data: any): Promise<{
        success: boolean;
    }>;
    updateProgress(userId: string, lessonId: string, data: any): Promise<{
        success: boolean;
    }>;
    completeLesson(userId: string, lessonId: string, timeSpent: number): Promise<{
        success: boolean;
        completed: boolean;
    }>;
    markLessonAsComplete(userId: string, lessonId: string): Promise<{
        success: boolean;
        completed: boolean;
    }>;
    getLessonQuiz(lessonId: string, language?: string): Promise<{
        lessonId: string;
        questions: any[];
    }>;
    submitQuiz(userId: string, lessonId: string, data: any): Promise<{
        success: boolean;
        score: number;
        passed: boolean;
    }>;
    submitLessonQuiz(userId: string, lessonId: string, answers: any[]): Promise<{
        success: boolean;
        score: number;
        passed: boolean;
    }>;
    getCourseOutline(courseId: string, userId?: string, language?: string): Promise<{
        courseId: string;
        modules: any[];
    }>;
    getCourseStructure(courseId: string, language?: string): Promise<{
        modules: any[];
    }>;
    getLessonNotes(userId: string, lessonId: string): Promise<{
        notes: string;
    }>;
    saveLessonNotes(userId: string, lessonId: string, data: any): Promise<{
        success: boolean;
        notes: any;
    }>;
    updateLessonNotes(userId: string, lessonId: string, content: string): Promise<{
        success: boolean;
        content: string;
    }>;
    createLesson(data: any): Promise<any>;
    updateLesson(id: string, data: any): Promise<any>;
    deleteLesson(id: string): Promise<{
        success: boolean;
    }>;
    publishLesson(id: string): Promise<{
        id: string;
        isPublished: boolean;
    }>;
    unpublishLesson(id: string): Promise<{
        id: string;
        isPublished: boolean;
    }>;
    reorderLessons(moduleId: string, order: any[]): Promise<{
        success: boolean;
    }>;
    getLessonAnalytics(id: string): Promise<{
        totalViews: number;
        completionRate: number;
    }>;
    getAdminLessons(options: any): Promise<{
        data: any[];
        total: number;
    }>;
    adminGetLessons(options: any): Promise<{
        data: any[];
        total: number;
    }>;
    getNextLesson(userId: string, currentLessonId: string): Promise<{
        id: string;
    }>;
    getPreviousLesson(userId: string, currentLessonId: string): Promise<{
        id: string;
    }>;
    bookmarkLesson(userId: string, lessonId: string): Promise<{
        success: boolean;
    }>;
    unbookmarkLesson(userId: string, lessonId: string): Promise<{
        success: boolean;
    }>;
    getBookmarkedLessons(userId: string, options: any): Promise<{
        data: any[];
        total: number;
    }>;
    getQuizAttempts(userId: string, lessonId: string): Promise<{
        data: any[];
    }>;
    resetQuizProgress(userId: string, lessonId: string): Promise<{
        success: boolean;
    }>;
    getLessonResources(lessonId: string): Promise<{
        data: any[];
    }>;
    addLessonResource(lessonId: string, data: any): Promise<any>;
    removeLessonResource(lessonId: string, resourceId: string): Promise<{
        success: boolean;
    }>;
    searchLessons(query: string, filters: any, options: any): Promise<{
        data: any[];
        total: number;
    }>;
    getPopularLessons(options: any): Promise<{
        data: any[];
        total: number;
    }>;
    getLessonDiscussion(userId: string, lessonId: string): Promise<{
        data: any[];
        total: number;
    }>;
}
