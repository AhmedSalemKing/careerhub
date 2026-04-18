import { LessonsService } from './lessons.service';
import { User } from '@prisma/client';
export declare class LessonsController {
    private readonly lessonsService;
    constructor(lessonsService: LessonsService);
    getLesson(id: string, language?: string): Promise<{
        success: boolean;
        data: {
            lesson: {
                id: string;
                title: string;
            };
        };
    }>;
    getLessonContent(user: User, id: string, language?: string): Promise<{
        success: boolean;
        data: {
            content: {
                id: string;
                content: string;
            };
        };
    }>;
    getLessonVideo(user: User, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            videoUrl: string;
        };
    }>;
    updateProgress(user: User, id: string, progressData: {
        progress: number;
        timeSpent?: number;
        currentSecond?: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
        };
    }>;
    completeLesson(user: User, id: string, timeSpent?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
            completed: boolean;
        };
    }>;
    getLessonQuiz(user: User, id: string, language?: string): Promise<{
        success: boolean;
        data: {
            quiz: {
                lessonId: string;
                questions: any[];
            };
        };
    }>;
    submitQuiz(user: User, id: string, submissionData: {
        answers: Array<{
            questionId: string;
            answer: string;
        }>;
        timeSpent?: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
            score: number;
            passed: boolean;
        };
    }>;
    getNextLesson(user: User, id: string): Promise<{
        success: boolean;
        data: {
            nextLesson: {
                id: string;
            };
        };
    }>;
    getPreviousLesson(user: User, id: string): Promise<{
        success: boolean;
        data: {
            previousLesson: {
                id: string;
            };
        };
    }>;
    getCourseOutline(courseId: string, language?: string): Promise<{
        success: boolean;
        data: {
            outline: {
                courseId: string;
                modules: any[];
            };
        };
    }>;
    getLessonNotes(user: User, id: string): Promise<{
        success: boolean;
        data: {
            notes: {
                notes: string;
            };
        };
    }>;
    saveLessonNotes(user: User, id: string, notesData: {
        content: string;
        timestamp?: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            notes: {
                success: boolean;
                notes: any;
            };
        };
    }>;
    getLessonDiscussion(id: string, page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
            data: any[];
            total: number;
        };
    }>;
    createLesson(createLessonDto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            lesson: any;
        };
    }>;
    updateLesson(id: string, updateLessonDto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            lesson: any;
        };
    }>;
    deleteLesson(id: string): Promise<void>;
    publishLesson(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            lesson: {
                id: string;
                isPublished: boolean;
            };
        };
    }>;
    unpublishLesson(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            lesson: {
                id: string;
                isPublished: boolean;
            };
        };
    }>;
    getLessonAnalytics(id: string): Promise<{
        success: boolean;
        data: {
            analytics: {
                totalViews: number;
                completionRate: number;
            };
        };
    }>;
    getAdminLessons(page?: number, limit?: number, courseId?: string, isPublished?: boolean): Promise<{
        success: boolean;
        data: {
            data: any[];
            total: number;
        };
    }>;
}
