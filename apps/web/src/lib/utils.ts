import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BRAND_PURPLE = '#5120c8'

const FORBIDDEN_COLORS = new Set([
  '#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd',
  '#2563EB', '#3B82F6', '#1D4ED8',
  '#2fb68e', '#2FB68E',
  '#22d380', '#22D380', '#22c594', '#22C594', '#20c594', '#20C594',
])

export function normalisePrimary(color: string): string {
  return FORBIDDEN_COLORS.has(color.trim()) ? BRAND_PURPLE : color.trim()
}
