/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surface palette — softer than pure gray, calmer in dark mode
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#0b1120',
        },
        // HTTP method palette — slightly desaturated so dark mode isn't harsh
        method: {
          get: '#3b82f6',
          post: '#10b981',
          put: '#f59e0b',
          delete: '#ef4444',
          patch: '#14b8a6',
          head: '#94a3b8',
          options: '#6366f1',
        },
        // Status / accent
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'soft-lg': '0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
        'inner-soft': 'inset 0 1px 2px 0 rgb(15 23 42 / 0.04)',
      },
      ringColor: {
        DEFAULT: 'rgb(59 130 246 / 0.4)',
      },
    },
  },
  plugins: [],
}
