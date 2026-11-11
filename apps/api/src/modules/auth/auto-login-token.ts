import { JwtService } from '@nestjs/jwt';

/**
 * Short-lived "auto-login" tokens emailed to approved consultants.
 * They are signed with a secret derived from JWT_SECRET but different from it,
 * so an auto-login token can never be used as a normal Bearer access token.
 */
const jwt = new JwtService({});
export const AUTO_LOGIN_EXPIRES_IN = '48h';

function secret(): string {
  const base = process.env.JWT_SECRET;
  if (!base) throw new Error('JWT_SECRET is not configured');
  return `${base}:auto-login`;
}

export function signAutoLoginToken(user: { id: string; email: string }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, type: 'auto-login' },
    { secret: secret(), expiresIn: AUTO_LOGIN_EXPIRES_IN },
  );
}

/** Returns the payload or null when the token is invalid, expired or of another type. */
export function verifyAutoLoginToken(token: string): { sub: string; email: string } | null {
  try {
    const p = jwt.verify<{ sub: string; email: string; type?: string }>(token, { secret: secret() });
    return p?.type === 'auto-login' && p.sub ? { sub: p.sub, email: p.email } : null;
  } catch {
    return null;
  }
}
