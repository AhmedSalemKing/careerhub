import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const ApiPagination = () => {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 20, max: 100)',
      example: 20,
    }),
  );
};

export const ApiSearch = () => {
  return applyDecorators(
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search query',
      example: 'javascript',
    }),
  );
};

export const ApiSort = () => {
  return applyDecorators(
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order (default: desc)',
      example: 'desc',
    }),
  );
};

export const ApiDateRange = () => {
  return applyDecorators(
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date (YYYY-MM-DD)',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date (YYYY-MM-DD)',
      example: '2024-12-31',
    }),
  );
};

export const ApiFilter = (fieldName: string, description: string, enumValues?: string[]) => {
  return ApiQuery({
    name: fieldName,
    required: false,
    enum: enumValues,
    description,
  });
};
