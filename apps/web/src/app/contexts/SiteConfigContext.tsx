'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../../lib/api'

type SiteConfig = Record<string, any>

const SiteConfigContext = createContext<SiteConfig>({})

export function useSiteConfig() {
  return useContext(SiteConfigContext)
}

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>({})

  useEffect(() => {
    api.get('/admin/site-config')
      .then((res) => {
        const data = res.data ?? res
        setConfig(data)
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          if (data['theme.primaryColor']) root.style.setProperty('--primary', data['theme.primaryColor'])
          if (data['theme.backgroundColor']) root.style.setProperty('--background', data['theme.backgroundColor'])
          if (data['theme.buttonColor']) root.style.setProperty('--button-color', data['theme.buttonColor'])
        }
      })
      .catch(() => {})
  }, [])

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  )
}
