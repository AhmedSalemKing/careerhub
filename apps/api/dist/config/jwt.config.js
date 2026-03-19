"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieOptions = exports.getJwtRefreshConfig = exports.getJwtConfig = void 0;
const getJwtConfig = (configService) => ({
    secret: configService.get('JWT_SECRET') || 'dev-secret',
    expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
    issuer: 'careerhub.com',
    audience: 'careerhub-users',
});
exports.getJwtConfig = getJwtConfig;
const getJwtRefreshConfig = (configService) => ({
    secret: configService.get('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
    expiresIn: configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    issuer: 'careerhub.com',
    audience: 'careerhub-users',
});
exports.getJwtRefreshConfig = getJwtRefreshConfig;
exports.cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};
