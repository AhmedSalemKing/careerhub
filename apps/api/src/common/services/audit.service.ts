import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export enum SecurityEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_BLOCKED = 'LOGIN_BLOCKED',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  ACCOUNT_APPROVED = 'ACCOUNT_APPROVED',
  ACCOUNT_REJECTED = 'ACCOUNT_REJECTED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  WALLET_TOPUP = 'WALLET_TOPUP',
  WALLET_PAYMENT = 'WALLET_PAYMENT',
  WALLET_TRANSFER = 'WALLET_TRANSFER',
  CERTIFICATE_ISSUED = 'CERTIFICATE_ISSUED',
  FILE_UPLOAD = 'FILE_UPLOAD',
  ADMIN_ACTION = 'ADMIN_ACTION',
  OAUTH_LOGIN = 'OAUTH_LOGIN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    event: SecurityEvent
    userId?: string
    email?: string
    ip?: string
    userAgent?: string
    metadata?: Record<string, any>
  }) {
    try {
      await this.prisma.securityLog.create({
        data: {
          event: params.event,
          userId: params.userId,
          email: params.email,
          ip: params.ip,
          userAgent: params.userAgent,
          metadata: params.metadata,
        },
      })
    } catch {
      // Never let audit logging break the main flow
    }
  }

  async getRecentFailedLogins(ip: string, minutes = 15): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000)
    return this.prisma.securityLog.count({
      where: {
        event: SecurityEvent.LOGIN_FAILED,
        ip,
        createdAt: { gte: since },
      },
    })
  }

  async getRecentPasswordResets(email: string, hours = 1): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.prisma.securityLog.count({
      where: {
        event: SecurityEvent.PASSWORD_RESET_REQUEST,
        email,
        createdAt: { gte: since },
      },
    })
  }
}
