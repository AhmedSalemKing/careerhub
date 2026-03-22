export function unwrap<T>(res: any): T { 
   return res?.data?.data ?? res?.data ?? res 
 } 
 export function unwrapList<T>(res: any, key?: string): T[] { 
   const data = res?.data?.data ?? res?.data ?? res 
   if (Array.isArray(data)) return data as T[] 
   if (key && Array.isArray(data?.[key])) return data[key] as T[] 
   for (const k of ['coaches','courses','careerPaths','sessions','certificates','notifications','users','items']) { 
     if (Array.isArray(data?.[k])) return data[k] as T[] 
   } 
   return [] 
 } 
