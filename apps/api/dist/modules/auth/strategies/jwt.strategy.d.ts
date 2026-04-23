import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptions] | [opt: import("passport-jwt").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        id: string;
        sub: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
        status: string;
        profile: {
            id: string;
            bio: string | null;
            linkedinUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            dateOfBirth: Date | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            nationality: string | null;
            country: string | null;
            city: string | null;
            avatar: string | null;
            timezone: string;
            language: string;
            userId: string;
        };
    }>;
}
export {};
