import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class ParseUUIDPipe implements PipeTransform<string, string> {
    transform(value: string, metadata: ArgumentMetadata): string;
}
export declare class ParseOptionalUUIDPipe implements PipeTransform<string, string | undefined> {
    transform(value: string, metadata: ArgumentMetadata): string | undefined;
}
