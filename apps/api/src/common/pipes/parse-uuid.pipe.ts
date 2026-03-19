import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException(`${metadata.data} is required`);
    }

    if (!isUUID(value)) {
      throw new BadRequestException(`${metadata.data} must be a valid UUID`);
    }

    return value;
  }
}

@Injectable()
export class ParseOptionalUUIDPipe implements PipeTransform<string, string | undefined> {
  transform(value: string, metadata: ArgumentMetadata): string | undefined {
    if (!value) {
      return undefined;
    }

    if (!isUUID(value)) {
      throw new BadRequestException(`${metadata.data} must be a valid UUID`);
    }

    return value;
  }
}
