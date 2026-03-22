'use client' 
 import { useLocale } from 'next-intl' 
 import { usePathname } from 'next/navigation' 
 export function LanguageSwitcher() { 
   const locale = useLocale() 
   const pathname = usePathname() 
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
