// Theme-aware skeleton colors (CSS variables switch with the `.dark` class)
const HERO = 'linear-gradient(to bottom, color-mix(in srgb, var(--brand) 12%, transparent), var(--bg))'
const BLOCK = { background: 'var(--line)' }
const SOFT = { background: 'var(--surface-2)' }
const CARD = { background: 'var(--surface)', borderColor: 'var(--line)' }

export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse" style={{ background: 'var(--bg)' }}>
      <section className="py-16" style={{ background: HERO }}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-full" style={BLOCK} />
          <div className="flex-1 w-full space-y-4">
            <div className="h-8 w-56 rounded" style={BLOCK} />
            <div className="h-6 w-40 rounded-full" style={BLOCK} />
            <div className="h-16 max-w-2xl rounded" style={SOFT} />
            <div className="flex flex-wrap gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 min-w-[120px] w-32 rounded-2xl border" style={CARD} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="h-7 w-32 rounded mb-6" style={BLOCK} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border rounded-2xl p-3" style={CARD}>
              <div className="aspect-video rounded-xl" style={BLOCK} />
              <div className="h-5 w-3/4 rounded mt-3" style={BLOCK} />
              <div className="h-4 w-1/2 rounded mt-2" style={SOFT} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
