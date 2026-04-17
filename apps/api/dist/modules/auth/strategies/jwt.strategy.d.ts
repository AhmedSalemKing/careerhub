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
            id: string;
            createdAt: Date;
            userId: string;
            bio: string | null;
            linkedinUrl: string | null;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            country: string | null;
            city: string | null;
            language: string;
            dateOfBirth: Date | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            nationality: string | null;
            avatar: string | null;
            timezone: string;
        };
    }>;
}
export {};
