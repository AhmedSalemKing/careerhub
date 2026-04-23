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
            id: string;
            createdAt: Date;
            userId: string;
            courseId: string | null;
            consultantId: string | null;
            value: number;
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
                id: string;
                createdAt: Date;
                userId: string;
                courseId: string | null;
                consultantId: string | null;
                value: number;
                comment: string | null;
            })[];
            average: number;
            count: number;
        };
    }>;
    getMyRating(courseId: string, req: any): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            courseId: string | null;
            consultantId: string | null;
            value: number;
            comment: string | null;
        };
    }>;
}
