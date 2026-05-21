'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PIE_COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444']

type ChartsProps = {
  traffic: Array<{ date: string; visits: number }>
  split: Array<{ name: string; value: number }>
  topEvents: Array<{ name: string; count: number }>
  revenue: Array<{ date: string; revenue: number }>
  t: (key: string) => string
}

export function AnalyticsCharts({ traffic, split, topEvents, revenue, t }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div className="text-sm font-extrabold text-foreground">{t('traffic')}</div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={traffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="visits" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div className="text-sm font-extrabold text-foreground">{t('platform_split')}</div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie data={split} dataKey="value" nameKey="name" outerRadius={110}>
                {split.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm lg:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="text-sm font-extrabold text-foreground">{t('revenue')}</div>
          <div className="text-xs text-[color:var(--muted)]">{t('revenue_hint')}</div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-72">
            <div className="mb-2 text-xs font-semibold text-[color:var(--muted)]">{t('top_events')}</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topEvents}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
