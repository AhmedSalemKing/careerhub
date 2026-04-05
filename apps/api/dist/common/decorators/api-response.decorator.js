"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiPaginatedResponse = exports.ApiCreatedResponse = exports.ApiStandardResponseSingle = exports.ApiStandardResponse = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const response_dto_1 = require("../dto/response.dto");
const ApiStandardResponse = (model, description) => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 200,
        description: description || 'Successful operation',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: (0, swagger_1.getSchemaPath)(model) },
                        },
                    },
                },
            ],
        },
    }));
};
exports.ApiStandardResponse = ApiStandardResponse;
const ApiStandardResponseSingle = (model, description) => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 200,
        description: description || 'Successful operation',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ResponseDto) },
                {
                    properties: {
                        data: {
                            $ref: (0, swagger_1.getSchemaPath)(model),
                        },
                    },
                },
            ],
        },
    }));
};
exports.ApiStandardResponseSingle = ApiStandardResponseSingle;
const ApiCreatedResponse = (model, description) => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 201,
        description: description || 'Resource created successfully',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ResponseDto) },
                {
                    properties: {
                        data: {
                            $ref: (0, swagger_1.getSchemaPath)(model),
                        },
                    },
                },
            ],
        },
    }));
};
exports.ApiCreatedResponse = ApiCreatedResponse;
const ApiPaginatedResponse = (model, description) => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiResponse)({
        status: 200,
        description: description || 'Paginated response',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_dto_1.ResponseDto) },
                {
                    properties: {
                        data: {
                            properties: {
                                items: {
                                    type: 'array',
                                    items: { $ref: (0, swagger_1.getSchemaPath)(model) },
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
    }));
};
exports.ApiPaginatedResponse = ApiPaginatedResponse;
//# sourceMappingURL=api-response.decorator.js.map