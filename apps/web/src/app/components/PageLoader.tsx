'use client'

import { useEffect, useState, useRef } from 'react'

/* ════════════════════════════════════════════════════════
   PAGE LOADER — 3D Star Animation (Horizontal)
   ════════════════════════════════════════════════════════ */

export function PageLoader({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!show) {
      setFading(true)
      const t = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(t)
    } else {
      setVisible(true)
      setFading(false)
    }
  }, [show])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'var(--background)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ═══ Container ═══ */}
      <div 
        className="relative"
        style={{
          width: 280,
          height: 180,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: 'perspective(600px) rotateX(55deg)',
        }}
      >
        {/* ── 15 Star Layers ── */}
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((i) => (
          <div
            key={`star-${i}`}
            className="aro"
            style={{
              position: 'absolute',
              inset: `${i * 8}px`,
              '--s': i,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── DEVEWAY Text (Centered above) ── */}
      <div 
        className="absolute flex flex-col items-center"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: "'PingARLT', 'Arial Black', sans-serif",
            fontWeight: 900,
            fontSize: typeof window !== 'undefined' && window.innerWidth > 768 ? 42 : 28,
            letterSpacing: '0.08em',
            color: 'var(--foreground)',
            textShadow: '0 2px 20px rgba(81, 32, 200, 0.3), 0 0 60px rgba(81, 32, 200, 0.15)',
            animation: 'logoPulse 2s ease-in-out infinite',
            whiteSpace: 'nowrap',
          }}
        >
          DEVEWAY
        </span>
        
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: '0.2em',
            color: 'var(--muted)',
            marginTop: 6,
          }}
        >
          LOADING...
        </span>
      </div>

      {/* ═══ CSS Keyframes ═══ */}
      <style>{`
        .aro {
          box-shadow: 
            inset 0 0 50px rgba(81, 32, 200, 0.6),
            inset 0 0 100px rgba(81, 32, 200, 0.25),
            0 0 30px rgba(81, 32, 200, 0.4);
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
          animation: standalone 2.8s infinite ease-in-out both;
          animation-delay: calc(var(--s) * -0.08s);
        }

        @keyframes standalone {
          0%, 100% {
            transform: translateZ(-80px) scaleX(-1) rotateZ(0deg);
            opacity: 0.4;
          }
          25% {
            transform: translateZ(-20px) scaleX(-0.8) rotateZ(5deg);
            opacity: 0.7;
          }
          50% {
            transform: translateZ(80px) scaleX(1) rotateZ(0deg);
            opacity: 1;
          }
          75% {
            transform: translateZ(20px) scaleX(0.8) rotateZ(-5deg);
            opacity: 0.7;
          }
        }

        @keyframes logoPulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.85; 
            transform: scale(1.02); 
          }
        }

        .dark .aro {
          box-shadow: 
            inset 0 0 60px rgba(124, 92, 232, 0.7),
            inset 0 0 120px rgba(124, 92, 232, 0.3),
            0 0 40px rgba(124, 92, 232, 0.5);
        }
      `}</style>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   LOADING PROVIDER
   ════════════════════════════════════════════════════════ */

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    const t = setTimeout(() => {
      if (mounted.current) setLoading(false)
    }, 1200)
    return () => { 
      mounted.current = false
      clearTimeout(t) 
    }
  }, [])

  return (
    <>
      <PageLoader show={loading} />
      <div style={{ 
        opacity: loading ? 0 : 1, 
        transition: 'opacity 0.4s ease 0.15s',
        minHeight: '100vh',
      }}>
        {children}
      </div>
    </>
  )
}