import { QueryClient } from '@tanstack/react-query'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,   // 5 min — don't refetch if fresh
        gcTime: 10 * 60 * 1000,      // 10 min — keep in cache
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
        refetchOnWindowFocus: false,
        refetchOnMount: false,       // use cached data if available
      },
      mutations: {
        retry: 1,
      },
    },
  })

export const queryClient = createQueryClient()
