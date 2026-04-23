export default function SkeletonCard({
  height = 120,
  count = 3,
}: {
  height?: number
  count?: number
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            borderRadius: 16,
            background:
              'linear-gradient(90deg, var(--surface-2, #1e2235) 25%, var(--surface-3, #252a40) 50%, var(--surface-2, #1e2235) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-shimmer 1.5s infinite',
            marginBottom: 12,
          }}
        />
      ))}
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
      `}</style>
    </>
  )
}
