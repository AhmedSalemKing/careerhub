import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    let message = 'Internal server error';
    let errors = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || message;
      errors = (exceptionResponse as any).errors || null;
    }

    // Handle validation errors
    if (status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
      errors = message.map((error: any) => ({
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
      this.logger.error(
        `${status} ${request.method} ${request.url}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `${status} ${request.method} ${request.url}: ${message}`,
      );
    }

    // Add rate limit headers if applicable
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      response.setHeader('Retry-After', '60');
      response.setHeader('X-RateLimit-Limit', '100');
      response.setHeader('X-RateLimit-Remaining', '0');
      response.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());
    }

    response
      .status(status)
      .json(errorResponse);
  }
}
