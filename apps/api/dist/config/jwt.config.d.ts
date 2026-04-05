import { ConfigService } from '@nestjs/config';
export declare const getJwtConfig: (configService: ConfigService) => {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
};
export declare const getJwtRefreshConfig: (configService: ConfigService) => {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
};
export declare const cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict";
    maxAge: number;
    path: string;
};
