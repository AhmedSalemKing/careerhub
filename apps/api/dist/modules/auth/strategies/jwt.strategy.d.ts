import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        id: string;
        sub: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
        profile: {
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            bio: string | null;
            linkedinUrl: string | null;
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
        };
    }>;
}
export {};
