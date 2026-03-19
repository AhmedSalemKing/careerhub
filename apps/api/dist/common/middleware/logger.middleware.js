"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerMiddleware = void 0;
const common_1 = require("@nestjs/common");
let LoggerMiddleware = class LoggerMiddleware {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    use(request, response, next) {
        const { ip, method, originalUrl } = request;
        const userAgent = request.get('User-Agent') || '';
        const startTime = Date.now();
        // Add request ID
        const requestId = this.generateRequestId();
        request.headers['x-request-id'] = requestId;
        // Log request
        this.logger.log(`${method} ${originalUrl} - ${ip} - ${userAgent} - RequestID: ${requestId}`);
        // Capture response
        const originalSend = response.send;
        let responseBody;
        response.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };
        // Log response
        response.on('finish', () => {
            const { statusCode } = response;
            const contentLength = response.get('content-length') || 0;
            const duration = Date.now() - startTime;
            const message = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms - RequestID: ${requestId}`;
            if (statusCode >= 400) {
                this.logger.warn(message);
            }
            else {
                this.logger.log(message);
            }
            // Log response body for debugging in development
            if (process.env.NODE_ENV === 'development' && statusCode >= 400) {
                this.logger.debug(`Response body: ${JSON.stringify(responseBody)}`);
            }
        });
        next();
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.LoggerMiddleware = LoggerMiddleware;
exports.LoggerMiddleware = LoggerMiddleware = __decorate([
    (0, common_1.Injectable)()
], LoggerMiddleware);
