import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    // Add request ID
    const requestId = this.generateRequestId();
    request.headers['x-request-id'] = requestId;

    // Log request
    this.logger.log(
      `${method} ${originalUrl} - ${ip} - ${userAgent} - RequestID: ${requestId}`,
    );

    // Capture response
    const originalSend = response.send;
    let responseBody: any;

    response.send = function (body: any) {
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
      } else {
        this.logger.log(message);
      }

      // Log response body for debugging in development
      if (process.env.NODE_ENV === 'development' && statusCode >= 400) {
        this.logger.debug(`Response body: ${JSON.stringify(responseBody)}`);
      }
    });

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
