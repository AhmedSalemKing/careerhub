import { QueryClient } from '@tanstack/react-query'

export const createQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  })

export const queryClient = createQueryClient()
