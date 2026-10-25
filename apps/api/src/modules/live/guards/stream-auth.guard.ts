import { Injectable, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'

/**
 * Allows JWT to be passed as a query parameter (`?token=...`) for
 * streaming endpoints. The <video> element cannot send custom headers,
 * so the token is copied into the Authorization header before the
 * standard JWT guard validates it.
 */
@Injectable()
export class StreamAuthGuard extends JwtAuthGuard {
  constructor(reflector: Reflector) {
    super(reflector)
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const token = request.query?.token
    if (token && typeof token === 'string' && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${token}`
    }
    return super.canActivate(context)
  }
}
