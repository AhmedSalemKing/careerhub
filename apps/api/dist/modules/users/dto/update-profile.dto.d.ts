import { Gender } from '@prisma/client';
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: Gender;
    nationality?: string;
    country?: string;
    city?: string;
    bio?: string;
    linkedinUrl?: string;
    language?: string;
    timezone?: string;
}
