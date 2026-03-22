'use client' 
 import { useLocale } from 'next-intl' 
 import { usePathname } from 'next/navigation' 
 import { useEffect, useState } from 'react'

 export function LanguageSwitcher() { 
   const [mounted, setMounted] = useState(false)
   useEffect(() => setMounted(true), [])

   const locale = useLocale() 
   const pathname = usePathname() 

   if (!mounted) return <div className="h-8 w-16 rounded-full bg-gray-200 animate-pulse" />

   function switchLocale() { 
     const newLocale = locale === 'ar' ? 'en' : 'ar' 
     const parts = pathname.split('/') 
     if (parts[1] === 'ar' || parts[1] === 'en') parts[1] = newLocale 
     else parts.splice(1, 0, newLocale) 
     window.location.href = parts.join('/') 
   } 
   return ( 
     <button onClick={switchLocale} 
       className="rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"> 
       {locale === 'ar' ? 'EN' : 'عربي'} 
     </button> 
   ) 
 } 
