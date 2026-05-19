'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { applySiteSettings } from '../components/Providers'

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
        applySiteSettings({
          primaryColor: data['theme.primaryColor'],
          backgroundColor: data['theme.backgroundColor'],
          buttonColor: data['theme.buttonColor'],
          siteName: data['brand.siteName'],
        })
      })
      .catch(() => {})
  }, [])

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  )
}
