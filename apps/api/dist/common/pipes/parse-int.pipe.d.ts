import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class ParseIntPipe implements PipeTransform<string, number> {
    private options?;
    constructor(options?: {
        min?: number;
        max?: number;
        optional?: boolean;
    });
    transform(value: string, metadata: ArgumentMetadata): number;
}
export declare class ParsePositiveIntPipe extends ParseIntPipe {
    constructor();
}
export declare class ParseOptionalIntPipe extends ParseIntPipe {
    constructor(options?: {
        min?: number;
        max?: number;
    });
}
