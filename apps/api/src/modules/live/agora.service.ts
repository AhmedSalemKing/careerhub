import { Injectable } from '@nestjs/common'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'

@Injectable()
export class AgoraService {
  private appId = process.env.AGORA_APP_ID || ''
  private appCertificate = process.env.AGORA_APP_CERTIFICATE || ''

  generateToken(channelName: string, uid: number, role: 'publisher' | 'subscriber' = 'subscriber'): string {
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER
    const expirationTime = Math.floor(Date.now() / 1000) + 86400

    return RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uid,
      rtcRole,
      expirationTime,
    )
  }

  generateChannelName(courseId: string): string {
    return `deveway_${courseId}_${Date.now()}`
  }

  getAppId(): string {
    return this.appId
  }
}
