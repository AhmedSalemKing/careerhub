import { PrismaService } from '../../prisma/prisma.service';
export declare class RatingsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    rateCourse(courseId: string, req: any, body: {
        value: number;
        comment?: string;
    }): Promise<{
        success: boolean;
        data: {
            createdAt: Date;
            id: string;
            courseId: string | null;
            userId: string;
            value: number;
            consultantId: string | null;
            comment: string | null;
        };
    }>;
    getCourseRatings(courseId: string): Promise<{
        success: boolean;
        data: {
            ratings: ({
                user: {
                    profile: {
                        firstName: string;
                        lastName: string;
                    };
                };
            } & {
                createdAt: Date;
                id: string;
                courseId: string | null;
                userId: string;
                value: number;
                consultantId: string | null;
                comment: string | null;
            })[];
            average: number;
            count: number;
        };
    }>;
    getMyRating(courseId: string, req: any): Promise<{
        success: boolean;
        data: {
            createdAt: Date;
            id: string;
            courseId: string | null;
            userId: string;
            value: number;
            consultantId: string | null;
            comment: string | null;
        };
    }>;
}
