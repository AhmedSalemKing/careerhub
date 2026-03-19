import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  constructor(private options?: { min?: number; max?: number; optional?: boolean }) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    if (!value && this.options?.optional) {
      return undefined;
    }

    if (!value) {
      throw new BadRequestException(`${metadata.data} is required`);
    }

    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
      throw new BadRequestException(`${metadata.data} must be a valid integer`);
    }

    if (this.options?.min !== undefined && parsedValue < this.options.min) {
      throw new BadRequestException(`${metadata.data} must be at least ${this.options.min}`);
    }

    if (this.options?.max !== undefined && parsedValue > this.options.max) {
      throw new BadRequestException(`${metadata.data} must be at most ${this.options.max}`);
    }

    return parsedValue;
  }
}

@Injectable()
export class ParsePositiveIntPipe extends ParseIntPipe {
  constructor() {
    super({ min: 1 });
  }
}

@Injectable()
export class ParseOptionalIntPipe extends ParseIntPipe {
  constructor(options?: { min?: number; max?: number }) {
    super({ ...options, optional: true });
  }
}
