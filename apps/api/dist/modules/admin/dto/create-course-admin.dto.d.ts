export declare class CourseSectionDto {
    title: string;
}
export declare class CreateCourseAdminDto {
    titleEn: string;
    titleAr?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    price?: number;
    currency?: string;
    duration?: number;
    level?: string;
    status?: string;
    careerPathId?: string;
    categoryId?: string;
    thumbnail?: string;
    previewVideo?: string;
    isInstructor?: boolean;
    instructorId?: string;
    sections?: CourseSectionDto[];
}
