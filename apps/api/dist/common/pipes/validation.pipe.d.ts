import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class CustomValidationPipe implements PipeTransform<any> {
    private readonly logger;
    transform(value: any, { metatype }: ArgumentMetadata): Promise<any>;
    private toValidate;
}
