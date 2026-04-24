"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseDto = exports.PaginatedResponseDto = exports.ResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ResponseDto {
}
exports.ResponseDto = ResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if the operation was successful',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response message',
        example: 'Operation completed successfully',
        required: false,
    }),
    __metadata("design:type", String)
], ResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response data',
        required: false,
    }),
    __metadata("design:type", Object)
], ResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details (if any)',
        required: false,
    }),
    __metadata("design:type", Object)
], ResponseDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response timestamp',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", String)
], ResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request ID for tracing',
        example: 'req_123456789',
        required: false,
    }),
    __metadata("design:type", String)
], ResponseDto.prototype, "requestId", void 0);
class PaginatedResponseDto {
}
exports.PaginatedResponseDto = PaginatedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of items',
        type: 'array',
    }),
    __metadata("design:type", Array)
], PaginatedResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
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
    }),
    __metadata("design:type", Object)
], PaginatedResponseDto.prototype, "meta", void 0);
class ErrorResponseDto {
}
exports.ErrorResponseDto = ErrorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates if the operation was successful',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ErrorResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error message',
        example: 'An error occurred',
    }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error code',
        example: 'INTERNAL_SERVER_ERROR',
    }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details',
        required: false,
    }),
    __metadata("design:type", Object)
], ErrorResponseDto.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response timestamp',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Stack trace (development only)',
        required: false,
    }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "stack", void 0);
//# sourceMappingURL=response.dto.js.map