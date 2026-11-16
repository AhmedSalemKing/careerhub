export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0D0A1F] animate-pulse">
      <section className="bg-gradient-to-b from-[#1A0E3F] to-[#0D0A1F] py-16">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-white/10" />
          <div className="flex-1 w-full space-y-4">
            <div className="h-8 w-56 rounded bg-white/10" />
            <div className="h-6 w-40 rounded-full bg-white/10" />
            <div className="h-16 max-w-2xl rounded bg-white/5" />
            <div className="flex flex-wrap gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 min-w-[120px] w-32 rounded-2xl bg-white/5 border border-white/10" />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="h-7 w-32 rounded bg-white/10 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="aspect-video rounded-xl bg-white/10" />
              <div className="h-5 w-3/4 rounded bg-white/10 mt-3" />
              <div className="h-4 w-1/2 rounded bg-white/5 mt-2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
