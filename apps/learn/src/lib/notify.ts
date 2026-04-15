import { toast } from 'sonner'

export const notify = {
  success: (msg: string) =>
    toast.success(msg, {
      style: { background: '#052e16', border: '1px solid #16a34a', color: '#86efac' },
    }),
  error: (msg: string) =>
    toast.error(msg, {
      style: { background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5' },
    }),
  info: (msg: string) =>
    toast.info(msg, {
      style: { background: '#0c1a3d', border: '1px solid #5120c8', color: '#93c5fd' },
    }),
}
