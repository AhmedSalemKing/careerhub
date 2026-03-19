"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : { message: 'Internal server error' };
        let message = 'Internal server error';
        let errors = null;
        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        }
        else if (typeof exceptionResponse === 'object') {
            message = exceptionResponse.message || message;
            errors = exceptionResponse.errors || null;
        }
        // Handle validation errors
        if (status === common_1.HttpStatus.BAD_REQUEST && Array.isArray(message)) {
            errors = message.map((error) => ({
                field: error.property,
                message: Object.values(error.constraints).join(', '),
            }));
            message = 'Validation failed';
        }
        const errorResponse = {
            success: false,
            statusCode: status,
            message,
            errors,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId: request.headers['x-request-id'] || null,
        };
        // Log error details
        if (status >= 500) {
            this.logger.error(`${status} ${request.method} ${request.url}`, exception.stack);
        }
        else {
            this.logger.warn(`${status} ${request.method} ${request.url}: ${message}`);
        }
        // Add rate limit headers if applicable
        if (status === common_1.HttpStatus.TOO_MANY_REQUESTS) {
            response.setHeader('Retry-After', '60');
            response.setHeader('X-RateLimit-Limit', '100');
            response.setHeader('X-RateLimit-Remaining', '0');
            response.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());
        }
        response
            .status(status)
            .json(errorResponse);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
