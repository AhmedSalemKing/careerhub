import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DeveWay — منصة التعليم العربية'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0d0d 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: '80px', fontWeight: 900, color: '#a78bfa', marginBottom: '16px' }}>
          DeveWay
        </div>
        <div style={{ fontSize: '32px', color: '#e2e8f0', marginBottom: '8px' }}>
          منصة التعليم والتطوير المهني
        </div>
        <div style={{ fontSize: '24px', color: '#9ca3af' }}>
          Arabic Educational Platform
        </div>
        <div style={{ marginTop: '40px', padding: '12px 32px', background: '#5120c8', borderRadius: '12px', color: 'white', fontSize: '20px' }}>
          deveways.com
        </div>
      </div>
    ),
    { ...size },
  )
}
