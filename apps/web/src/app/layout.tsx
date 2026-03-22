import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CareerHub',
  description: 'CareerHub platform',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
