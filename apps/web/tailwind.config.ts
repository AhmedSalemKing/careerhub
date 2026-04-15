import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:       '#1B2340',
        purple:     '#7B4FE8',
        teal:       '#2BBFA3',
        gold:       '#F5A623',
        brand:      '#F8F8FA',
        primary:    'var(--primary)',
        foreground: 'var(--foreground)',
        background: 'var(--background)',
        surface:    'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        border:     'var(--border)',
        muted:      'var(--muted)',
        success:    'var(--success)',
        error:      'var(--error)',
        warning:    'var(--warning)',
      },
      fontFamily: {
        brand:   ['PingARLT', 'Arial Black', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body:    ['PingARLT', 'Arial Black', 'sans-serif'],
        madinet: ['PingARLT', 'Cairo', 'sans-serif'],
        hero:    ['28DaysLater', 'sans-serif'],
        sans:    ['PingARLT', 'Arial Black', 'sans-serif'],
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        xl:   '18px',
        '2xl': '22px',
        '3xl': '28px',
      },
      boxShadow: {
        sm:   '0 1px 3px rgba(27,35,64,0.06)',
        md:   '0 2px 8px rgba(27,35,64,0.08)',
        lg:   '0 4px 16px rgba(27,35,64,0.10)',
        xl:   '0 8px 24px rgba(27,35,64,0.12)',
        none: 'none',
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideLeft: {
          "0%":   { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideRight: {
          "0%":   { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        shake: {
          "0%, 100%":                       { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%":        { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%":             { transform: "translateX(5px)" },
        },
        timelinePulse: {
          "0%, 100%": { transform: "scale(1)",   opacity: "1" },
          "50%":      { transform: "scale(1.2)", opacity: "0.8" },
        },
      },
      animation: {
        "fade-up":         "fadeUp 0.6s ease forwards",
        "fade-in":         "fadeIn 0.4s ease forwards",
        "slide-in":        "slideIn 0.3s ease forwards",
        "slide-left":      "slideLeft 0.35s ease forwards",
        "slide-right":     "slideRight 0.35s ease forwards",
        "scale-in":        "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float":           "float 4s ease-in-out infinite",
        "shake":           "shake 0.5s ease-in-out",
        "timeline-pulse":  "timelinePulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;