import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  data?: T;

  @ApiProperty({
    description: 'Error details (if any)',
    required: false,
  })
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request ID for tracing',
    example: 'req_123456789',
    required: false,
  })
  requestId?: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items',
    type: 'array',
  })
  items: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      total: { type: 'number', description: 'Total number of items' },
      page: { type: 'number', description: 'Current page number' },
      limit: { type: 'number', description: 'Items per page' },
      totalPages: { type: 'number', description: 'Total number of pages' },
      hasNext: { type: 'boolean', description: 'Has next page' },
      hasPrev: { type: 'boolean', description: 'Has previous page' },
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'An error occurred',
  })
  message: string;

  @ApiProperty({
    description: 'Error code',
    example: 'INTERNAL_SERVER_ERROR',
  })
  error: string;

  @ApiProperty({
    description: 'Error details',
    required: false,
  })
  details?: any;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Stack trace (development only)',
    required: false,
  })
  stack?: string;
}
