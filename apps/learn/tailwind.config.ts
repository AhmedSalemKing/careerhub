import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: { DEFAULT: '#2563EB', dark: '#1d4ed8', foreground: '#ffffff' },
        secondary: { DEFAULT: '#1E3A8A', foreground: '#ffffff' },
        accent: { DEFAULT: '#F59E0B', foreground: '#ffffff' },
        success: { DEFAULT: '#10B981', foreground: '#ffffff' },
        danger: { DEFAULT: '#EF4444', foreground: '#ffffff' },
        surface: { light: '#F8FAFC', dark: '#1E293B' },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'var(--font-cairo)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'slide-left': 'slideLeft 0.35s ease forwards',
        'slide-right': 'slideRight 0.35s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config

