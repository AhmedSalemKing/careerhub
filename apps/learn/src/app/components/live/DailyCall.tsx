'use client';

interface DailyCallProps {
  roomUrl: string;
  token: string;
}

export function DailyCall({ roomUrl, token }: DailyCallProps) {
  if (!roomUrl || !token) return null;
  return (
    <iframe
      src={`${roomUrl}?t=${token}`}
      allow="camera; microphone; fullscreen; speaker; display-capture"
      allowFullScreen
      style={{
        width: '100%',
        height: '600px',
        border: 'none',
        borderRadius: '8px',
      }}
    />
  );
}
