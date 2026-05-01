import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but does NOT reject unauthenticated requests.
 * If a valid token is present, req.user is populated.
 * If missing or invalid, req.user stays undefined — request proceeds.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Never throw — just return null for unauthenticated requests
  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}
