import { SetMetadata } from '@nestjs/common';

export const Ownership = (resourceType: string) => SetMetadata('resourceType', resourceType);
