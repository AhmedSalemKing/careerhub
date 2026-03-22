import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // If already wrapped, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data
        }
        // Otherwise wrap it
        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path: context.switchToHttp().getRequest().url,
            method: context.switchToHttp().getRequest().method,
            requestId: null,
            duration: 0,
          }
        }
      })
    )
  }
}

