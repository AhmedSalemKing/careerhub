import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseDto } from '../dto/response.dto';

export const ApiStandardResponse = <TModel extends Type<any>>(model: TModel, description?: string) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: description || 'Successful operation',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiStandardResponseSingle = <TModel extends Type<any>>(model: TModel, description?: string) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: description || 'Successful operation',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiCreatedResponse = <TModel extends Type<any>>(model: TModel, description?: string) => {
  return applyDecorators(
    ApiResponse({
      status: 201,
      description: description || 'Resource created successfully',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel, description?: string) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: description || 'Paginated response',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      total: { type: 'number' },
                      page: { type: 'number' },
                      limit: { type: 'number' },
                      totalPages: { type: 'number' },
                      hasNext: { type: 'boolean' },
                      hasPrev: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};
