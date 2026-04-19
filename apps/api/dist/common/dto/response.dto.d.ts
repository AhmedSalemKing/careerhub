export declare class ResponseDto<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
    requestId?: string;
}
export declare class PaginatedResponseDto<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare class ErrorResponseDto {
    success: boolean;
    message: string;
    error: string;
    details?: any;
    timestamp: string;
    stack?: string;
}
